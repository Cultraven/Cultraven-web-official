/**
 * Property-based tests for everything a customer or the team receives by email, and for the PDF receipt.
 * fast-check builds hundreds of random orders, names, addresses and notes — with HTML, quotes, line breaks, emoji and huge or
 * broken numbers — and every email must still be safe, well-formed and complete.
 */
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { PDFDocument } from "pdf-lib";
import {
  customerOrderEmail, adminOrderEmail, orderStatusEmail, adminCustomerActionEmail, supportAdminEmail, supportAckEmail, welcomeEmail, passwordResetEmail,
  passwordChangedEmail, staffAccountCreatedEmail, deliveryKYCSubmittedEmail, deliveryKYCDecisionEmail, escapeHtml, orderNumber, type MailOrder,
} from "./email-templates";
import { ORDER_STATUSES, STATUS_LABEL, buildTimeline } from "./order-lifecycle";
import { buildInvoicePdf } from "./invoice-pdf";

// Parsing hundreds of generated emails into a real DOM takes a while; this is thoroughness, not slowness in the app.
vi.setConfig({ testTimeout: 180_000 });
/** Runs per property. The DOM-parsing ones are heavy, so CI uses a lean count; run `PROP_SCALE=10 pnpm test` for a much deeper search. */
const SCALE = Number(process.env.PROP_SCALE) || 1;
const runs = (n: number) => ({ numRuns: Math.max(1, Math.round(n * SCALE)) });

const SITE = "https://cultraven.com";
const text = fc.oneof(fc.string(), fc.string({ unit: "grapheme" }), fc.string({ unit: "binary" }), fc.constantFrom("", " ", "<script>alert(1)</script>", "\"><img src=x onerror=alert(1)>", "' onmouseover='x", "a\r\nBcc: evil@x.com", "{{7*7}}", "‮evil", "javascript:alert(1)"));
const shortText = text.map((s) => s.slice(0, 80));
const money = fc.integer({ min: 0, max: 1_000_000_000 });
const weirdNumber = fc.oneof(money, fc.constantFrom(0, -1, Number.NaN, Infinity, 1e21, 0.1 + 0.2));
const hexId = fc.stringMatching(/^[0-9a-f]{24}$/);
const when = fc.date({ min: new Date("2020-01-01"), max: new Date("2040-01-01"), noInvalidDate: true });

const item = (price: fc.Arbitrary<number>) => fc.record({
  title: shortText, size: shortText, color: fc.option(shortText, { nil: undefined }), quantity: fc.integer({ min: 0, max: 1000 }), pricePaise: price,
  image: fc.option(fc.oneof(shortText, fc.webUrl(), fc.constant("/uploads/a.png"), fc.constant("javascript:alert(1)"), fc.constant("data:image/png;base64,AAAA")), { nil: undefined }),
});
const address = fc.record({ name: shortText, email: fc.option(shortText, { nil: undefined }), phone: shortText, line1: shortText, line2: fc.option(shortText, { nil: undefined }), city: shortText, state: shortText, pincode: shortText });
const order = (price: fc.Arbitrary<number>): fc.Arbitrary<MailOrder> => fc.record({
  id: hexId, createdAt: when, paymentMethod: fc.constantFrom("cod" as const, "razorpay" as const), paymentStatus: fc.constantFrom("pending", "paid", "failed", "refunded", "refund_pending", "weird"),
  items: fc.array(item(price), { minLength: 0, maxLength: 4 }), subtotalPaise: price, discountPaise: price, shippingPaise: price, codFeePaise: price, totalPaise: price, deliveryAddress: address,
});
const realOrder = order(money);

/** What must be true of EVERY email we send. */
function assertSafe(m: { subject: string; html: string; text: string }) {
  expect(typeof m.subject).toBe("string");
  expect(m.subject).not.toMatch(/[\r\n]/); // a customer-typed line break can never add a header (Bcc:…) to the email
  expect(m.subject.trim().length).toBeGreaterThan(0);
  expect(m.html.startsWith("<!doctype html>")).toBe(true);
  expect(m.text).not.toContain("style="); // the plain-text part carries no template markup (customer-typed text may of course contain < >)
  const doc = new DOMParser().parseFromString(m.html, "text/html");
  expect(doc.querySelectorAll("script, iframe, object, embed, form, input, textarea, link, base, meta[http-equiv], svg, video, audio").length).toBe(0);
  for (const el of Array.from(doc.querySelectorAll("*"))) for (const a of Array.from(el.attributes)) expect(a.name.toLowerCase().startsWith("on")).toBe(false);
  for (const a of Array.from(doc.querySelectorAll("a"))) {
    const href = a.getAttribute("href") ?? "";
    expect(href).toMatch(/^(https?:\/\/[^\s]+|mailto:[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+(\?subject=[^&?#\s]*)?|tel:\+\d{10,13})$/);
  }
  for (const i of Array.from(doc.querySelectorAll("img"))) {
    expect(i.getAttribute("src") ?? "").toMatch(/^https?:\/\/[^\s]+$/);
    expect(i.hasAttribute("alt")).toBe(true);
  }
  expect(m.html.length).toBeLessThan(100_000); // Gmail cuts off ("clips") anything longer
}

describe("customer and team order emails", () => {
  it("any order, however strange the names, items and notes: safe, well-formed, and every product title appears (escaped) in the email", () => {
    fc.assert(fc.property(realOrder, (o) => {
      const mails = [customerOrderEmail(o, SITE, { receiptAttached: true }), adminOrderEmail(o, SITE)];
      for (const m of mails) assertSafe(m);
      for (const i of o.items) if (i.title.trim()) expect(mails[0].html).toContain(escapeHtml(i.title));
      expect(mails[0].subject).toContain(orderNumber(o.id));
    }), runs(60));
  });
  it("the total, written the Indian way, is always in the email when amounts are real numbers", () => {
    fc.assert(fc.property(realOrder, (o) => {
      expect(customerOrderEmail(o, SITE).html).toContain(`₹${(o.totalPaise / 100).toLocaleString("en-IN")}`);
    }), runs(100));
  });
  it("never throws for any numbers at all (NaN, Infinity, negatives, astronomically large) — a data glitch must not lose the email", () => {
    fc.assert(fc.property(order(weirdNumber), (o) => {
      expect(() => { customerOrderEmail(o, SITE); adminOrderEmail(o, SITE); orderStatusEmail(o, SITE, { status: "shipped" }); }).not.toThrow();
    }), runs(120));
  });
  it("cancel / return alerts for the team are safe for any reason text", () => {
    fc.assert(fc.property(realOrder, shortText, fc.constantFrom("cancelled" as const, "cancel_requested" as const, "return_requested" as const), (o, reason, kind) => { assertSafe(adminCustomerActionEmail(o, SITE, kind, reason)); }), runs(40));
  });
});

describe("order status emails and the vertical tracker", () => {
  const status = fc.oneof(fc.constantFrom(...ORDER_STATUSES, "cancel_requested"), fc.string({ maxLength: 12 }));
  const history = fc.array(fc.record({ status: fc.constantFrom(...ORDER_STATUSES), at: when.map((d) => d.toISOString()), note: fc.option(shortText, { nil: undefined }) }), { maxLength: 8 });
  const trackerLabels = (html: string) => [...html.matchAll(/vertical-align:middle">([^<]+)<\/span><(?:div|\/td)/g)].map((m) => m[1]);

  it("for any status, history, courier and note: safe, and the tracker is coherent (one current step, ✓ only on steps that are listed)", () => {
    fc.assert(fc.property(realOrder, status, history, fc.option(shortText, { nil: undefined }), fc.option(shortText, { nil: undefined }), (o, st, hist, courier, note) => {
      const timeline = ORDER_STATUSES.includes(st as never) ? buildTimeline({ fulfillmentStatus: st, createdAt: o.createdAt, statusHistory: hist }) : undefined;
      const m = orderStatusEmail(o, SITE, { status: st, courier, trackingNumber: courier ? "DLV1" : undefined, note, timeline });
      assertSafe(m);
      const rows = [...m.html.matchAll(/border-left:2px solid #[0-9A-Fa-f]{6};padding:0 0 \d+px 26px/g)].length;
      expect((m.html.match(/&#10003;/g) ?? []).length).toBeLessThanOrEqual(rows);
      expect((m.html.match(/Current status/g) ?? []).length).toBeLessThanOrEqual(1);
      for (const l of trackerLabels(m.html)) expect(Object.values(STATUS_LABEL).concat(["Returned & refunded"]).map(escapeHtml)).toContain(l);
    }), runs(80));
  });
  it("a cancelled, returned-to-origin or returned order never lists steps it did not reach (no hollow dots after a red ✕)", () => {
    fc.assert(fc.property(realOrder, history, fc.constantFrom("cancelled", "rto", "returned"), (o, hist, st) => {
      const m = orderStatusEmail(o, SITE, { status: st, timeline: buildTimeline({ fulfillmentStatus: st, createdAt: o.createdAt, statusHistory: hist }) });
      expect(m.html).not.toContain("background:#ffffff;border:2px solid #C9C3B3");
      expect(m.html).toContain("&#10005;");
    }), runs(100));
  });
  it("the timeline itself: steps are in lifecycle order, there is never more than one 'current', and it survives broken dates", () => {
    const anyDate = fc.oneof(when, when.map((d) => d.toISOString()), fc.constant("garbage"), fc.constant(Number.NaN as unknown as string));
    fc.assert(fc.property(fc.constantFrom(...ORDER_STATUSES), anyDate, fc.array(fc.record({ status: fc.constantFrom(...ORDER_STATUSES), at: anyDate }), { maxLength: 6 }), (st, created, hist) => {
      const steps = buildTimeline({ fulfillmentStatus: st, createdAt: created as Date, statusHistory: hist as never });
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(steps.filter((s) => s.state === "current").length).toBeLessThanOrEqual(1);
      for (const s of steps) if (s.at !== undefined) expect(Number.isNaN(new Date(s.at).getTime())).toBe(false);
      const flow = ["processing", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
      expect(steps.slice(0, 6).map((s) => s.key)).toEqual(flow);
    }), runs(300));
  });
});

describe("support, account, password and staff emails", () => {
  it("support alert and acknowledgement are safe for any message, subject, name and phone", () => {
    fc.assert(fc.property(shortText, shortText, shortText, text, fc.option(shortText, { nil: undefined }), (name, email, subject, message, phone) => {
      const mail = { ref: "HLP-1A2B3C", name, email, phone, subject: subject || "x", message, orderRef: "CR-1A2B3C" };
      assertSafe(supportAdminEmail(mail, SITE));
      assertSafe(supportAckEmail(mail, SITE, "Mon–Sat, 10 AM – 7 PM IST"));
    }), runs(60));
  });
  it("welcome, password reset, password changed and staff set-password emails are safe for any name and address", () => {
    fc.assert(fc.property(shortText, shortText, fc.constantFrom("admin" as const, "delivery" as const, "customer" as const), when, (name, email, role, at) => {
      assertSafe(welcomeEmail({ firstName: name, siteUrl: SITE }));
      assertSafe(passwordResetEmail({ firstName: name, email, resetUrl: `${SITE}/reset-password?token=${"A".repeat(43)}`, expiresMinutes: 30, requestedAt: at, siteUrl: SITE }));
      assertSafe(passwordChangedEmail({ firstName: name, changedAt: at, signInUrl: `${SITE}/login`, resetUrl: `${SITE}/forgot-password`, siteUrl: SITE }));
      assertSafe(staffAccountCreatedEmail({ firstName: name, email, setPasswordUrl: `${SITE}/reset-password?token=${"A".repeat(43)}`, expiresHours: 48, role, loginUrl: `${SITE}/portal-access`, siteUrl: SITE }));
      assertSafe(deliveryKYCSubmittedEmail({ partnerName: name, partnerEmail: email, adminUrl: `${SITE}/portal-secure/delivery-verification`, siteUrl: SITE }));
      assertSafe(deliveryKYCDecisionEmail({ firstName: name, approved: false, note: email, loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE }));
    }), runs(30));
  });
  it("a password-reset email never shows the full address, only a masked one, and always holds the link", () => {
    fc.assert(fc.property(fc.stringMatching(/^[a-z][a-z0-9.]{3,15}@[a-z]{3,8}\.com$/), (email) => {
      const url = `${SITE}/reset-password?token=${"B".repeat(43)}`;
      const m = passwordResetEmail({ firstName: "Asha", email, resetUrl: url, expiresMinutes: 30, requestedAt: new Date(), siteUrl: SITE });
      expect(m.html).not.toContain(email);
      expect(m.html).toContain(url);
      expect(m.text).toContain(url);
      expect(m.html + m.text).not.toContain(email);
    }), runs(120));
  });
});

describe("PDF receipt", () => {
  it("is always a valid PDF with at least one page, for any strings and amounts (including Hindi, emoji, line breaks and 60 items)", async () => {
    await fc.assert(fc.asyncProperty(order(weirdNumber), fc.integer({ min: 0, max: 60 }), async (o, extra) => {
      const items = [...o.items, ...Array.from({ length: extra }, (_, i) => ({ title: `Item ${i} ${o.deliveryAddress.name}`, size: "M", quantity: 1, pricePaise: 149900 }))];
      const bytes = await buildInvoicePdf({ ...o, items });
      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
      expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(1);
    }), runs(30));
  }, 120_000);
});
