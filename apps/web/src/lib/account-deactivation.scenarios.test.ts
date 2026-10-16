// @vitest-environment node
/**
 * Scenario tests for deactivating an account from the admin: the admin route that does it, and what the customer's phone can still do afterwards.
 * A deactivated (or self-deleted) customer who is still signed in must be locked out of every customer API at once, and a reactivated one is let back in.
 * The database is a fake; the routes and the session check are the real code.
 */
import crypto from "crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ users: new Map<string, any>(), dbDown: false, updates: [] as any[] }));

vi.mock("@/lib/db", () => ({ connectToDatabase: async () => { if (h.dbDown) throw new Error("db down"); } }));
const chain = (val: any) => { const c: any = { select: () => c, lean: async () => (val ? structuredClone(val) : null) }; return c; };
vi.mock("@/lib/models/User", () => ({
  User: {
    findById: (id: string) => chain(h.users.get(String(id))),
    findByIdAndUpdate: (id: string, update: any) => {
      const doc = h.users.get(String(id));
      h.updates.push({ id, update });
      if (doc) Object.assign(doc, update);
      return chain(doc);
    },
  },
}));
vi.mock("@/lib/models/Order", () => ({ Order: { find: () => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) }) } }));

import { currentCustomer } from "./customer-auth";
import { GET as myOrders } from "../app/api/orders/me/route";
import { POST as createOrder } from "../app/api/razorpay/create-order/route";
import { PATCH as setStatus } from "../app/api/admin/users/[id]/status/route";

const SECRET = "scenario-session-secret-0123456789abcdef";
const sign = (p: object) => { const b = Buffer.from(JSON.stringify(p)).toString("base64url"); return `${b}.${crypto.createHmac("sha256", SECRET).update(b).digest("base64url")}`; };
const CUSTOMER = "64b7f0f0f0f0f0f0f0f0f0c1";
const ADMIN_USER = "64b7f0f0f0f0f0f0f0f0f0a1";
const customerCookie = (over: Record<string, unknown> = {}) => `cultraven_session=${sign({ userId: CUSTOMER, email: "buyer@example.com", role: "customer", iat: Date.now() - 60_000, exp: Date.now() + 7 * 86_400_000, ...over })}`;
const adminCookie = (role: "admin" | "superadmin" = "admin") => `cultraven_admin_session=${sign({ role, exp: Date.now() + 3_600_000, email: "boss@example.com" })}`;
let n = 0;
const req = (path: string, cookie: string | null, init: { method?: string; body?: unknown } = {}) =>
  new NextRequest(`http://localhost${path}`, { method: init.method ?? "GET", headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-forwarded-for": `10.7.${Math.floor(++n / 250)}.${n % 250 + 1}`, ...(cookie ? { cookie } : {}) }, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
const deactivate = (id: string, status: unknown, cookie: string | null = adminCookie()) => setStatus(req(`/api/admin/users/${id}/status`, cookie, { method: "PATCH", body: { status } }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  h.users.clear(); h.updates.length = 0; h.dbDown = false;
  h.users.set(CUSTOMER, { role: "customer", status: "active", deletedAt: null });
  h.users.set(ADMIN_USER, { role: "admin", status: "active", deletedAt: null });
  vi.stubEnv("SESSION_SECRET", SECRET);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("scenario: who counts as a signed-in customer", () => {
  it("a valid session of an active account is accepted", async () => {
    expect(await currentCustomer(req("/x", customerCookie()))).toMatchObject({ userId: CUSTOMER, email: "buyer@example.com" });
  });
  it("no cookie, a tampered cookie and an expired cookie are all signed out", async () => {
    expect(await currentCustomer(req("/x", null))).toBeNull();
    expect(await currentCustomer(req("/x", customerCookie().replace(/.$/, "x")))).toBeNull();
    expect(await currentCustomer(req("/x", customerCookie({ exp: Date.now() - 1000 })))).toBeNull();
    expect(await currentCustomer(req("/x", customerCookie({ userId: "not-an-id" })))).toBeNull();
  });
  it("an account deactivated by the admin is signed out", async () => {
    h.users.set(CUSTOMER, { role: "customer", status: "deleted", deletedAt: new Date() });
    expect(await currentCustomer(req("/x", customerCookie()))).toBeNull();
  });
  it("an account the customer deleted themselves, or one that no longer exists, is signed out", async () => {
    h.users.set(CUSTOMER, { role: "customer", status: "active", deletedAt: new Date() });
    expect(await currentCustomer(req("/x", customerCookie()))).toBeNull();
    h.users.delete(CUSTOMER);
    expect(await currentCustomer(req("/x", customerCookie()))).toBeNull();
  });
  it("a password change signs out devices that signed in before it, but not ones that signed in after", async () => {
    h.users.set(CUSTOMER, { role: "customer", status: "active", deletedAt: null, passwordChangedAt: new Date() });
    expect(await currentCustomer(req("/x", customerCookie({ iat: Date.now() - 3_600_000 })))).toBeNull();
    expect(await currentCustomer(req("/x", customerCookie({ iat: Date.now() + 5_000 })))).not.toBeNull();
  });
  it("when the database is down it answers 'not signed in' instead of crashing", async () => {
    h.dbDown = true;
    expect(await currentCustomer(req("/x", customerCookie()))).toBeNull();
  });
});

describe("scenario: the admin deactivates, then reactivates, a customer", () => {
  it("while the account is active the customer's phone works; the moment it is deactivated every customer API refuses it; reactivating lets it back in", async () => {
    expect((await myOrders(req("/api/orders/me", customerCookie()))).status).toBe(200);

    const off = await deactivate(CUSTOMER, "deleted");
    expect(off.status).toBe(200);
    expect(await off.json()).toMatchObject({ ok: true, status: "deleted" });
    expect(h.users.get(CUSTOMER).deletedAt).toBeInstanceOf(Date);

    expect((await myOrders(req("/api/orders/me", customerCookie()))).status).toBe(401);
    const order = await createOrder(req("/api/razorpay/create-order", customerCookie(), { method: "POST", body: { items: [{ slug: "x", quantity: 1 }] } }));
    expect(order.status).toBe(401);
    expect((await order.json()).code).toBe("LOGIN_REQUIRED");

    const on = await deactivate(CUSTOMER, "active");
    expect(on.status).toBe(200);
    expect(h.users.get(CUSTOMER).deletedAt).toBeNull();
    expect((await myOrders(req("/api/orders/me", customerCookie()))).status).toBe(200);
  });
  it("only 'active' and 'deleted' are accepted, and a bad id or a missing user is refused", async () => {
    for (const status of ["banned", "", undefined, 1, null]) expect((await deactivate(CUSTOMER, status)).status, String(status)).toBe(422);
    expect((await deactivate("not-an-id", "deleted")).status).toBe(400);
    expect((await deactivate("64b7f0f0f0f0f0f0f0f0f0ff", "deleted")).status).toBe(404);
    expect(h.updates).toHaveLength(0);
  });
  it("only a signed-in admin can do it, and only the owner can deactivate another admin", async () => {
    expect((await deactivate(CUSTOMER, "deleted", null)).status).toBe(401);
    expect((await deactivate(CUSTOMER, "deleted", customerCookie())).status).toBe(401);
    expect(h.users.get(CUSTOMER).status).toBe("active");

    expect((await deactivate(ADMIN_USER, "deleted", adminCookie("admin"))).status).toBe(403);
    expect(h.users.get(ADMIN_USER).status).toBe("active");
    expect((await deactivate(ADMIN_USER, "deleted", adminCookie("superadmin"))).status).toBe(200);
    expect(h.users.get(ADMIN_USER).status).toBe("deleted");
  });
});
