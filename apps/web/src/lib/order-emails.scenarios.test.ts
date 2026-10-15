// @vitest-environment node
/**
 * Scenario tests for every email a customer gets about an order: "order placed", each status the shop or the courier moves it to,
 * tracking details, cancellation and refund. The database and the mail server are fakes; the mailer, the routing, the templates and the
 * real API routes (admin PUT /api/orders/:id and the courier's PATCH /api/delivery/orders/:id/status) are the real code.
 */
import crypto from "crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  store: new Map<string, any>(),
  logs: [] as any[],
  sent: [] as any[],
  orders: new Map<string, any>(),
  users: new Map<string, any>(),
  after: [] as (() => Promise<unknown>)[],
  released: [] as string[],
  smtpDown: false,
  failUsers: new Set<string>(), // mailboxes whose login is refused
  failCode: "EAUTH",
  pdfFail: false,
}));

vi.mock("@/lib/db", () => ({ connectToDatabase: async () => {} }));
vi.mock("@/lib/models/Setting", () => ({
  Setting: {
    findOne: (q: { key: string }) => ({ lean: async () => (h.store.has(q.key) ? { key: q.key, value: structuredClone(h.store.get(q.key)) } : null) }),
    findOneAndUpdate: async () => {},
    updateOne: async () => ({ matchedCount: 0 }),
  },
  EmailLog: { create: async (e: unknown) => { h.logs.push(e); } },
}));
vi.mock("@/lib/secret-box", () => ({ encryptSecret: (s: string) => `enc:${Buffer.from(s).toString("base64")}`, decryptSecret: (s: string) => (typeof s === "string" && s.startsWith("enc:") ? Buffer.from(s.slice(4), "base64").toString() : "") }));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: (o: { auth: { user: string } }) => ({
      verify: async () => {},
      sendMail: async (m: any) => {
        if (h.smtpDown) throw Object.assign(new Error("connect"), { code: "ECONNECTION" });
        if (h.failUsers.has(o.auth.user)) throw Object.assign(new Error(h.failCode), { code: h.failCode });
        h.sent.push({ ...m, smtpUser: o.auth.user });
      },
    }),
  },
}));

const match = (doc: any, f: Record<string, any>) =>
  Object.entries(f).every(([k, v]) => {
    if (k === "_id") return String(doc._id) === String(v);
    if (v === null) return doc[k] == null;
    if (v && typeof v === "object" && "$in" in v) return v.$in.includes(doc[k]);
    return doc[k] === v;
  });
const chain = (val: any) => { const c: any = { select: () => c, lean: async () => (val ? structuredClone(val) : null) }; return c; };
vi.mock("@/lib/models/Order", () => ({
  Order: {
    findById: (id: string) => chain(h.orders.get(String(id))),
    findOneAndUpdate: (f: Record<string, any>, u: any) => {
      const doc = [...h.orders.values()].find((d) => match(d, f));
      if (!doc) return chain(null);
      if (u.$set) Object.assign(doc, u.$set);
      if (u.$push) for (const [k, v] of Object.entries(u.$push)) (doc[k] ||= []).push(v);
      return chain(doc);
    },
  },
}));
vi.mock("@/lib/models/User", () => ({ User: { findById: (id: string) => chain(h.users.get(String(id))) } }));
vi.mock("@/lib/models/Product", () => ({ Product: { find: () => ({ sort: () => ({ limit: () => ({ select: () => ({ lean: async () => [] }) }) }) }) } }));
vi.mock("@/lib/invoice-pdf", () => ({ buildInvoicePdf: async () => { if (h.pdfFail) throw new Error("pdf failed"); return new Uint8Array([37, 80, 68, 70]); } }));
vi.mock("@/lib/inventory", () => ({ releaseOrderStock: async (id: string) => { h.released.push(id); return true; } }));
vi.mock("next/server", async (orig) => {
  const real = await orig<typeof import("next/server")>();
  return { ...real, after: (fn: unknown) => { h.after.push(typeof fn === "function" ? (fn as () => Promise<unknown>) : async () => fn); } };
});

import { notifyOrderPlaced, notifyStatusChange } from "./order-notify";
import { orderNumber } from "./email-templates";
import { PUT as adminPUT } from "../app/api/orders/[id]/route";
import { PATCH as courierPATCH } from "../app/api/delivery/orders/[id]/status/route";

const SECRET = "scenario-session-secret-0123456789abcdef";
const token = (payload: object) => { const p = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${p}.${crypto.createHmac("sha256", SECRET).update(p).digest("base64url")}`; };
const adminCookie = () => `cultraven_admin_session=${token({ role: "admin", exp: Date.now() + 3_600_000, email: "boss@example.com" })}`;
const courierCookie = (userId = "courier1") => `cultraven_delivery_session=${token({ role: "delivery", userId, email: "rider@example.com", name: "Rider", exp: Date.now() + 3_600_000 })}`;

const ID = "64b7f0f0f0f0f0f0f0f0f001";
const BUYER = "buyer@example.com";
const makeOrder = (over: Record<string, any> = {}) => ({
  _id: ID, createdAt: new Date("2026-10-15T08:51:00Z"), paymentMethod: "cod", paymentStatus: "pending", fulfillmentStatus: "processing", emailNotifiedAt: null,
  items: [{ productId: "p1", title: "Raven Hoodie", size: "M", color: "Black", quantity: 1, pricePaise: 254800, image: "" }],
  subtotalPaise: 254800, discountPaise: 0, shippingPaise: 0, codFeePaise: 0, totalPaise: 254800,
  deliveryAddress: { name: "Asha Buyer", email: BUYER, phone: "9876512399", line1: "12 Palm Road", city: "Indore", state: "Madhya Pradesh", pincode: "452001" },
  statusHistory: [], ...over,
});
const mailbox = (user: string, name: string, extra: Record<string, unknown> = {}) => ({ enabled: true, host: "smtp.gmail.com", port: 465, secure: true, user, passEnc: `enc:${Buffer.from("abcdefghijklmnop").toString("base64")}`, fromName: name, fromEmail: user, adminEmails: [], ...extra });
const ORDERS_BOX = mailbox("orders@cultraven.com", "CULTRAVEN", { adminEmails: ["team@cultraven.com", "owner@example.com"] });
const SUPPORT_BOX = mailbox("support@cultraven.com", "CULTRAVEN Support");

const flush = async () => { while (h.after.length) await h.after.shift()!(); };
const adminPut = async (body: unknown, cookie: string | null = adminCookie()) => {
  const res = await adminPUT(new NextRequest(`http://localhost/api/orders/${ID}`, { method: "PUT", headers: { "content-type": "application/json", host: "localhost", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) }), { params: Promise.resolve({ id: ID }) });
  await flush();
  return res;
};
const courierPatch = async (body: unknown, cookie: string | null = courierCookie(), id = ID) => {
  const res = await courierPATCH(new NextRequest(`http://localhost/api/delivery/orders/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json", host: "localhost", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
  await flush();
  return res;
};
const toBuyer = () => h.sent.filter((m) => m.to === BUYER);
const subjects = () => toBuyer().map((m) => m.subject as string);

beforeEach(() => {
  h.store.clear(); h.logs.length = 0; h.sent.length = 0; h.orders.clear(); h.users.clear(); h.after.length = 0; h.released.length = 0; h.smtpDown = false; h.failUsers.clear(); h.failCode = "EAUTH"; h.pdfFail = false;
  h.store.set("smtp", ORDERS_BOX);
  h.orders.set(ID, makeOrder());
  h.users.set("courier1", { verificationStatus: "approved" });
  vi.stubEnv("SESSION_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cultraven.com");
  for (const k of Object.keys(process.env)) if (k.startsWith("SMTP_")) vi.stubEnv(k, "");
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("scenario: the customer places an order", () => {
  it("the customer gets one confirmation with the receipt attached, and every team address gets one alert", async () => {
    await notifyOrderPlaced(ID);
    expect(toBuyer()).toHaveLength(1);
    const mail = toBuyer()[0];
    expect(mail.subject).toContain(orderNumber(ID));
    expect(mail.smtpUser).toBe("orders@cultraven.com");
    expect(mail.attachments.some((a: any) => /^CULTRAVEN-receipt-.*\.pdf$/.test(a.filename))).toBe(true);
    expect(h.sent.filter((m) => m.to === "team@cultraven.com")).toHaveLength(1);
    expect(h.sent.filter((m) => m.to === "owner@example.com")).toHaveLength(1);
    expect(h.sent).toHaveLength(3);
    expect(h.logs.filter((l) => l.status === "sent").map((l) => l.kind).sort()).toEqual(["order-admin", "order-admin", "order-customer"]);
  });
  it("is announced once even when the payment check and the payment webhook both fire", async () => {
    await Promise.all([notifyOrderPlaced(ID), notifyOrderPlaced(ID), notifyOrderPlaced(ID)]);
    expect(h.sent).toHaveLength(3);
    await notifyOrderPlaced(ID);
    expect(h.sent).toHaveLength(3);
  });
  it("still sends the confirmation, without the receipt, when the PDF can't be made", async () => {
    h.pdfFail = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    await notifyOrderPlaced(ID);
    expect(toBuyer()).toHaveLength(1);
    expect(toBuyer()[0].attachments.some((a: any) => /receipt/.test(a.filename))).toBe(false);
  });
  it("when email isn't set up nothing is sent, nothing throws, and the log says why", async () => {
    h.store.clear();
    await expect(notifyOrderPlaced(ID)).resolves.toBeUndefined();
    expect(h.sent).toHaveLength(0);
    expect(h.logs.filter((l) => l.kind === "order-customer")).toEqual([expect.objectContaining({ status: "skipped", error: "SMTP not configured" })]);
  });
  it("when the mail server is down it never throws, and the log says the email failed", async () => {
    vi.useFakeTimers();
    h.smtpDown = true;
    const p = notifyOrderPlaced(ID);
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(p).resolves.toBeUndefined();
    expect(h.logs.some((l) => l.kind === "order-customer" && l.status === "failed" && /ECONNECTION/.test(l.error))).toBe(true);
  });
  it("an order with no customer email only alerts the team", async () => {
    h.orders.set(ID, makeOrder({ deliveryAddress: { ...makeOrder().deliveryAddress, email: "" } }));
    await notifyOrderPlaced(ID);
    expect(h.sent.map((m) => m.to).sort()).toEqual(["owner@example.com", "team@cultraven.com"]);
  });
});

describe("scenario: the shop moves the order along (admin)", () => {
  it("every step from confirmed to delivered emails the customer once, from the Orders mailbox, with the tracker", async () => {
    const steps = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
    for (const s of steps) {
      const before = toBuyer().length;
      const res = await adminPut({ fulfillmentStatus: s });
      expect(res.status, s).toBe(200);
      expect(toBuyer().length, s).toBe(before + 1);
      const mail = toBuyer().at(-1)!;
      expect(mail.subject).toContain(orderNumber(ID));
      expect(mail.smtpUser).toBe("orders@cultraven.com");
      expect(mail.html).toContain("Order tracker");
      expect(mail.html).toContain(`/account/orders/${ID}`);
    }
    expect(subjects().map((s) => s.split(": ")[1])).toEqual(["Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"]);
    expect(h.sent.filter((m) => m.to !== BUYER)).toHaveLength(0); // the team is not emailed about their own clicks
    expect(h.logs.filter((l) => l.status === "sent").map((l) => l.kind)).toEqual(["order-status-confirmed", "order-status-packed", "order-status-shipped", "order-status-out_for_delivery", "order-status-delivered"]);
  });
  it("delivering a Cash on Delivery order marks the cash as collected", async () => {
    for (const s of ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"]) await adminPut({ fulfillmentStatus: s });
    expect(h.orders.get(ID).paymentStatus).toBe("paid");
    expect(h.orders.get(ID).deliveredAt).toBeInstanceOf(Date);
  });
  it("a jump the workflow doesn't allow is refused and nobody is emailed", async () => {
    const res = await adminPut({ fulfillmentStatus: "delivered" });
    expect(res.status).toBe(409);
    expect(h.sent).toHaveLength(0);
    expect(h.orders.get(ID).fulfillmentStatus).toBe("processing");
  });
  it("'Email the customer' switched off sends nothing, but the order still moves", async () => {
    const res = await adminPut({ fulfillmentStatus: "confirmed", notify: false });
    expect(res.status).toBe(200);
    expect(h.orders.get(ID).fulfillmentStatus).toBe("confirmed");
    expect(h.sent).toHaveLength(0);
  });
  it("fixing a mis-click (moving back) is silent unless the admin asks to notify", async () => {
    await adminPut({ fulfillmentStatus: "confirmed" });
    await adminPut({ fulfillmentStatus: "packed" });
    h.sent.length = 0;
    await adminPut({ fulfillmentStatus: "confirmed" });
    expect(h.sent).toHaveLength(0);
    await adminPut({ fulfillmentStatus: "packed" });
    expect(h.sent).toHaveLength(1);
  });
  it("saving courier and tracking details emails them, with a tracking link", async () => {
    for (const s of ["confirmed", "packed", "shipped"]) await adminPut({ fulfillmentStatus: s });
    h.sent.length = 0;
    await adminPut({ courierName: "Delhivery", trackingNumber: "DL123456789", trackingUrl: "https://track.example.com/DL123456789" });
    expect(toBuyer()).toHaveLength(1);
    expect(toBuyer()[0].html).toContain("Delhivery");
    expect(toBuyer()[0].html).toContain("DL123456789");
    expect(toBuyer()[0].html).toContain("https://track.example.com/DL123456789");
  });
  it("cancelling needs a reason, tells a Cash on Delivery customer nothing was charged, and puts the stock back", async () => {
    expect((await adminPut({ fulfillmentStatus: "cancelled" })).status).toBe(422);
    expect(h.sent).toHaveLength(0);
    expect((await adminPut({ fulfillmentStatus: "cancelled", note: "Out of stock" })).status).toBe(200);
    expect(toBuyer()).toHaveLength(1);
    expect(toBuyer()[0].html).toContain("Out of stock");
    expect(toBuyer()[0].html).toContain("Nothing was charged");
    expect(h.released).toEqual([ID]);
  });
  it("cancelling an online-paid order promises the refund and flags it as due", async () => {
    h.orders.set(ID, makeOrder({ paymentMethod: "razorpay", paymentStatus: "paid", razorpayPaymentId: "pay_X1" }));
    await adminPut({ fulfillmentStatus: "cancelled", note: "Customer asked" });
    expect(toBuyer()[0].html).toMatch(/refund goes back to the original payment method/);
    expect(h.orders.get(ID).paymentStatus).toBe("refund_pending");
  });
  it("'Mark refunded' emails the customer the refund amount once, and never for a Cash on Delivery order", async () => {
    h.orders.set(ID, makeOrder({ paymentMethod: "razorpay", paymentStatus: "paid", razorpayPaymentId: "pay_X1" }));
    await adminPut({ fulfillmentStatus: "cancelled", note: "Customer asked" });
    h.sent.length = 0;
    expect((await adminPut({ paymentStatus: "refunded", note: "Refund issued" })).status).toBe(200);
    expect(toBuyer()).toHaveLength(1);
    const mail = toBuyer()[0];
    expect(mail.subject).toBe(`${orderNumber(ID)}: Refund issued`);
    expect(mail.html).toContain("Refund amount");
    expect(mail.html).toMatch(/2,548/);
    expect(mail.text).toMatch(/Refund amount:/);
    expect(mail.smtpUser).toBe("orders@cultraven.com");
    h.sent.length = 0;
    await adminPut({ paymentStatus: "refunded" }); // pressing it again changes nothing
    expect(h.sent).toHaveLength(0);

    h.orders.set(ID, makeOrder({ paymentMethod: "cod", paymentStatus: "paid" }));
    await adminPut({ paymentStatus: "refunded" });
    expect(h.sent).toHaveLength(0);
  });
  it("refund email can be switched off with 'Email the customer'", async () => {
    h.orders.set(ID, makeOrder({ paymentMethod: "razorpay", paymentStatus: "refund_pending", fulfillmentStatus: "cancelled" }));
    await adminPut({ paymentStatus: "refunded", notify: false });
    expect(h.sent).toHaveLength(0);
  });
  it("nobody but a signed-in admin can change an order", async () => {
    expect((await adminPut({ fulfillmentStatus: "confirmed" }, null)).status).toBe(401);
    expect((await adminPut({ fulfillmentStatus: "confirmed" }, courierCookie())).status).toBe(401);
    expect(h.sent).toHaveLength(0);
  });
});

describe("scenario: the courier updates the delivery", () => {
  beforeEach(() => { h.orders.set(ID, makeOrder({ fulfillmentStatus: "shipped" })); });

  it("'Out for delivery' and 'Delivered' each email the customer, and delivering a COD order marks the cash collected", async () => {
    expect((await courierPatch({ status: "out_for_delivery" })).status).toBe(200);
    expect(subjects().map((s) => s.split(": ")[1])).toEqual(["Out for delivery"]);
    expect((await courierPatch({ status: "delivered" })).status).toBe(200);
    expect(subjects().map((s) => s.split(": ")[1])).toEqual(["Out for delivery", "Delivered"]);
    expect(toBuyer().every((m) => m.smtpUser === "orders@cultraven.com")).toBe(true);
    const o = h.orders.get(ID);
    expect(o.fulfillmentStatus).toBe("delivered");
    expect(o.paymentStatus).toBe("paid");
    expect(o.deliveredAt).toBeInstanceOf(Date);
    expect(o.statusHistory.map((x: any) => x.status)).toEqual(["out_for_delivery", "delivered"]);
    expect(h.logs.filter((l) => l.status === "sent").map((l) => l.kind)).toEqual(["order-status-out_for_delivery", "order-status-delivered"]);
  });
  it("a failed delivery attempt emails the customer, and delivering an online-paid order leaves payment as it was", async () => {
    expect((await courierPatch({ status: "delivery_failed", note: "Door locked" })).status).toBe(200);
    expect(subjects()[0]).toContain("Delivery attempt failed");
    h.orders.set(ID, makeOrder({ fulfillmentStatus: "out_for_delivery", paymentMethod: "razorpay", paymentStatus: "paid" }));
    await courierPatch({ status: "delivered" });
    expect(h.orders.get(ID).paymentStatus).toBe("paid");
  });
  it("pressing the same button twice records and emails it once", async () => {
    await courierPatch({ status: "out_for_delivery" });
    const res = await courierPatch({ status: "out_for_delivery" });
    expect(res.status).toBe(200);
    expect((await res.json()).unchanged).toBe(true);
    expect(toBuyer()).toHaveLength(1);
    expect(h.orders.get(ID).statusHistory).toHaveLength(1);
  });
  it("a finished or cancelled order can't be revived from the delivery screen", async () => {
    for (const fulfillmentStatus of ["cancelled", "delivered", "returned", "rto", "processing", "return_requested"]) {
      h.orders.set(ID, makeOrder({ fulfillmentStatus }));
      const res = await courierPatch({ status: fulfillmentStatus === "delivered" ? "out_for_delivery" : "delivered" });
      expect(res.status, fulfillmentStatus).toBe(409);
      expect(h.orders.get(ID).fulfillmentStatus).toBe(fulfillmentStatus);
    }
    expect(h.sent).toHaveLength(0);
  });
  it("only the three courier statuses are accepted", async () => {
    for (const status of ["cancelled", "confirmed", "refunded", "", undefined, 42]) expect((await courierPatch({ status })).status, String(status)).toBe(422);
    expect(h.sent).toHaveLength(0);
  });
  it("needs a courier login, and the courier must be approved", async () => {
    expect((await courierPatch({ status: "delivered" }, null)).status).toBe(401);
    expect((await courierPatch({ status: "delivered" }, adminCookie().replace("cultraven_admin_session", "cultraven_delivery_session"))).status).toBe(401);
    h.users.set("courier2", { verificationStatus: "pending" });
    expect((await courierPatch({ status: "delivered" }, courierCookie("courier2"))).status).toBe(403);
    expect((await courierPatch({ status: "delivered" }, courierCookie("ghost"))).status).toBe(403);
    expect(h.orders.get(ID).fulfillmentStatus).toBe("shipped");
    expect(h.sent).toHaveLength(0);
  });
  it("an admin can use the same route, and a bad order id is refused", async () => {
    expect((await courierPatch({ status: "out_for_delivery" }, adminCookie())).status).toBe(200);
    expect(toBuyer()).toHaveLength(1);
    expect((await courierPatch({ status: "delivered" }, courierCookie(), "not-an-id")).status).toBe(400);
    expect((await courierPatch({ status: "delivered" }, courierCookie(), "64b7f0f0f0f0f0f0f0f0f0ff")).status).toBe(404);
  });
});

describe("scenario: the customer's own actions and the safety nets", () => {
  it("a status email is never sent to anyone but the address on the order", async () => {
    h.orders.set(ID, makeOrder({ deliveryAddress: { ...makeOrder().deliveryAddress, email: "someone.else@example.org" } }));
    await notifyStatusChange(ID, { status: "packed" });
    expect(h.sent.map((m) => m.to)).toEqual(["someone.else@example.org"]);
  });
  it("an order with no customer email, or no longer in the database, is skipped quietly", async () => {
    h.orders.set(ID, makeOrder({ deliveryAddress: { ...makeOrder().deliveryAddress, email: "" } }));
    await expect(notifyStatusChange(ID, { status: "packed" })).resolves.toBeUndefined();
    await expect(notifyStatusChange("64b7f0f0f0f0f0f0f0f0f0aa", { status: "packed" })).resolves.toBeUndefined();
    expect(h.sent).toHaveLength(0);
  });
  it("customer-requested cancel and return emails are logged against the right order", async () => {
    await notifyStatusChange(ID, { status: "cancel_requested", note: "Changed my mind" });
    await notifyStatusChange(ID, { status: "return_requested", note: "Wrong size" });
    expect(h.logs.map((l) => [l.kind, l.orderId])).toEqual([["order-status-cancel_requested", ID], ["order-status-return_requested", ID]]);
    expect(subjects()[0]).toContain("Cancellation requested");
  });
  it("with the Support mailbox also set up, order emails still come from Orders", async () => {
    h.store.set("smtp-support", SUPPORT_BOX);
    await notifyOrderPlaced(ID);
    await adminPut({ fulfillmentStatus: "confirmed" });
    expect(h.sent.length).toBeGreaterThan(0);
    expect(new Set(h.sent.map((m) => m.smtpUser))).toEqual(new Set(["orders@cultraven.com"]));
  });
  it("a deliberately paused Orders mailbox means order emails are skipped, and the log says 'Email disabled'", async () => {
    h.store.set("smtp", { ...ORDERS_BOX, enabled: false });
    h.store.set("smtp-support", SUPPORT_BOX);
    await adminPut({ fulfillmentStatus: "confirmed" });
    expect(h.sent).toHaveLength(0);
    expect(h.logs).toEqual([expect.objectContaining({ kind: "order-status-confirmed", status: "skipped", error: "Email disabled" })]);
  });
  it("if the Orders login breaks (wrong or revoked password), the customer's email goes out through Support instead, and the log says so", async () => {
    vi.useFakeTimers();
    h.store.set("smtp-support", SUPPORT_BOX);
    h.failUsers.add("orders@cultraven.com");
    const p = adminPut({ fulfillmentStatus: "confirmed" });
    for (let i = 0; i < 8; i++) await vi.advanceTimersByTimeAsync(1_000);
    expect((await p).status).toBe(200);
    expect(toBuyer()).toHaveLength(1);
    expect(toBuyer()[0].smtpUser).toBe("support@cultraven.com");
    expect(h.logs).toEqual([expect.objectContaining({ kind: "order-status-confirmed", status: "sent", from: "support@cultraven.com", error: expect.stringContaining("orders@cultraven.com failed (EAUTH)") })]);
  });
  it("if both logins are broken the email is logged as failed, once", async () => {
    vi.useFakeTimers();
    h.store.set("smtp-support", SUPPORT_BOX);
    h.failUsers.add("orders@cultraven.com").add("support@cultraven.com");
    const p = adminPut({ fulfillmentStatus: "confirmed" });
    for (let i = 0; i < 8; i++) await vi.advanceTimersByTimeAsync(1_000);
    await p;
    expect(h.sent).toHaveLength(0);
    expect(h.logs).toEqual([expect.objectContaining({ status: "failed", from: "orders@cultraven.com", error: expect.stringContaining("EAUTH") })]);
  });
  it("a refused recipient address is not retried through the other mailbox", async () => {
    vi.useFakeTimers();
    h.store.set("smtp-support", SUPPORT_BOX);
    h.failUsers.add("orders@cultraven.com");
    h.failCode = "EENVELOPE";
    const p = adminPut({ fulfillmentStatus: "confirmed" });
    for (let i = 0; i < 8; i++) await vi.advanceTimersByTimeAsync(1_000);
    await p;
    expect(h.sent).toHaveLength(0);
    expect(h.logs).toEqual([expect.objectContaining({ status: "failed", error: expect.stringContaining("EENVELOPE") })]);
  });
  it("a single-mailbox shop with a broken login logs the failure and has no one to fall back to", async () => {
    vi.useFakeTimers();
    h.failUsers.add("orders@cultraven.com");
    const p = adminPut({ fulfillmentStatus: "confirmed" });
    for (let i = 0; i < 8; i++) await vi.advanceTimersByTimeAsync(1_000);
    await p;
    expect(h.sent).toHaveLength(0);
    expect(h.logs).toEqual([expect.objectContaining({ status: "failed" })]);
  });
});
