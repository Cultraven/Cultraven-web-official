// @vitest-environment node
/**
 * Scenario tests for the admin Email settings API: who may call it, what it accepts, what it refuses, and what it reports — with the
 * database, the mail server and DNS replaced by fakes. Includes the two-mailbox set-up and the "which mailbox sends what" overview.
 */
import crypto from "crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  store: new Map<string, any>(),
  logs: [] as any[],
  aggRows: [] as any[],
  sent: [] as any[],
  dnsCalls: [] as string[],
  dnsFail: false,
  verifyFail: null as null | { code: string; response?: string },
}));

vi.mock("@/lib/db", () => ({ connectToDatabase: async () => {} }));
vi.mock("@/lib/models/Setting", () => ({
  Setting: {
    findOne: (q: { key: string }) => ({ lean: async () => (h.store.has(q.key) ? { key: q.key, value: structuredClone(h.store.get(q.key)) } : null) }),
    findOneAndUpdate: async (q: { key: string }, u: { $set: { value: unknown } }) => { h.store.set(q.key, structuredClone(u.$set.value)); },
    updateOne: async (q: { key: string }, u: { $set: Record<string, unknown> }) => {
      if (!h.store.has(q.key)) return { matchedCount: 0 };
      const v = h.store.get(q.key);
      for (const [path, val] of Object.entries(u.$set)) v[path.replace(/^value\./, "")] = val;
      return { matchedCount: 1 };
    },
  },
  EmailLog: {
    create: async (e: unknown) => { h.logs.push(e); },
    aggregate: async () => h.aggRows,
    find: () => ({ sort: () => ({ limit: () => ({ lean: async () => h.logs.map((l, i) => ({ _id: `l${i}`, createdAt: new Date(), ...l })) }) }) }),
  },
}));
vi.mock("@/lib/secret-box", () => ({ encryptSecret: (s: string) => `enc:${Buffer.from(s).toString("base64")}`, decryptSecret: (s: string) => (typeof s === "string" && s.startsWith("enc:") ? Buffer.from(s.slice(4), "base64").toString() : "") }));
vi.mock("nodemailer", () => ({ default: { createTransport: (o: { auth: { user: string } }) => ({ verify: async () => { if (h.verifyFail) throw Object.assign(new Error(h.verifyFail.code), h.verifyFail); }, sendMail: async (m: any) => { h.sent.push({ ...m, smtpUser: o.auth.user }); } }) } }));
vi.mock("@/lib/mail-dns", async (orig) => {
  const real = await orig<typeof import("@/lib/mail-dns")>();
  return { ...real, checkMailDns: async (from: string) => { if (h.dnsFail) throw new Error("dns down"); h.dnsCalls.push(real.domainOf(from)); return { domain: real.domainOf(from), google: true, allGood: false, spf: { status: "missing", title: "SPF", message: "m" }, dkim: { status: "missing", title: "DKIM", message: "m" }, dmarc: { status: "missing", title: "DMARC", message: "m" }, mx: { status: "ok", records: ["1 smtp.google.com"] } }; } };
});

import { GET as smtpGET, PUT as smtpPUT } from "../app/api/admin/settings/smtp/route";
import { POST as testPOST } from "../app/api/admin/settings/smtp/test/route";
import { GET as dnsGET } from "../app/api/admin/settings/smtp/dns/route";
import { GET as routingGET, PUT as routingPUT } from "../app/api/admin/settings/mail-routing/route";
import { GET as logsGET } from "../app/api/admin/email-logs/route";

const SECRET = "scenario-session-secret-0123456789abcdef";
const adminCookie = (role: "admin" | "superadmin" | "customer" = "admin", exp = Date.now() + 3_600_000) => {
  const payload = Buffer.from(JSON.stringify({ role, exp, email: "boss@example.com" })).toString("base64url");
  return `cultraven_admin_session=${payload}.${crypto.createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
};
let n = 0;
const call = (fn: (r: NextRequest) => Promise<Response>, path: string, over: { method?: string; body?: unknown; cookie?: string | null; origin?: string | null } = {}) => {
  const headers: Record<string, string> = { host: "localhost", "content-type": "application/json", "x-forwarded-for": `10.9.${Math.floor(++n / 250)}.${n % 250 + 1}` };
  if (over.cookie !== null) headers.cookie = over.cookie ?? adminCookie();
  if (over.origin !== null) headers.origin = over.origin ?? "http://localhost";
  return fn(new NextRequest(`http://localhost${path}`, { method: over.method ?? "GET", headers, body: over.body === undefined ? undefined : JSON.stringify(over.body) }));
};
const box = (user: string, name: string, extra: Record<string, unknown> = {}) => ({ enabled: true, host: "smtp.gmail.com", port: 465, secure: true, user, pass: user.startsWith("support") ? "supportpasswordx" : "orderspasswordab", fromName: name, fromEmail: user, ...extra });
const ORDERS = box("orders@cultraven.com", "CULTRAVEN", { adminEmails: "team@cultraven.com" });
const SUPPORT = box("support@cultraven.com", "CULTRAVEN Support");
const saveBoth = async () => { await call(smtpPUT, "/api/admin/settings/smtp?profile=orders", { method: "PUT", body: ORDERS }); await call(smtpPUT, "/api/admin/settings/smtp?profile=support", { method: "PUT", body: SUPPORT }); };

beforeEach(() => { h.store.clear(); h.logs.length = 0; h.aggRows.length = 0; h.sent.length = 0; h.dnsCalls.length = 0; h.dnsFail = false; h.verifyFail = null; vi.stubEnv("SESSION_SECRET", SECRET); for (const k of Object.keys(process.env)) if (k.startsWith("SMTP_")) vi.stubEnv(k, ""); });
afterEach(() => vi.unstubAllEnvs());

describe("scenario: who may use the Email settings", () => {
  const routes: [string, () => Promise<Response>][] = [
    ["GET smtp", () => call(smtpGET, "/api/admin/settings/smtp", { cookie: null })],
    ["PUT smtp", () => call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: ORDERS, cookie: null })],
    ["POST test", () => call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "a@b.co" }, cookie: null })],
    ["GET dns", () => call(dnsGET, "/api/admin/settings/smtp/dns", { cookie: null })],
    ["GET routing", () => call(routingGET, "/api/admin/settings/mail-routing", { cookie: null })],
    ["PUT routing", () => call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body: { routing: {} }, cookie: null })],
    ["GET logs", () => call(logsGET, "/api/admin/email-logs", { cookie: null })],
  ];
  it.each(routes)("%s without a login is refused (401)", async (_n, run) => { expect((await run()).status).toBe(401); });
  it("a customer's session, a forged cookie and an expired admin cookie are all refused", async () => {
    for (const cookie of [adminCookie("customer"), adminCookie("admin", Date.now() - 1000), "cultraven_admin_session=eyJyb2xlIjoiYWRtaW4ifQ.forged"]) {
      expect((await call(routingGET, "/api/admin/settings/mail-routing", { cookie })).status).toBe(401);
      expect((await call(smtpGET, "/api/admin/settings/smtp", { cookie })).status).toBe(401);
    }
  });
  it("an admin and a superadmin are both allowed", async () => {
    for (const role of ["admin", "superadmin"] as const) expect((await call(routingGET, "/api/admin/settings/mail-routing", { cookie: adminCookie(role) })).status).toBe(200);
  });
  it("changes from another website are refused even with a valid login", async () => {
    expect((await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: ORDERS, origin: "https://evil.example" })).status).toBe(403);
    expect((await call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body: { routing: {} }, origin: "https://evil.example" })).status).toBe(403);
    expect(h.store.size).toBe(0);
  });
});

describe("scenario: saving the two mailboxes", () => {
  it("each is saved separately; the password is never returned; unknown mailbox names are refused", async () => {
    await saveBoth();
    const o = await (await call(smtpGET, "/api/admin/settings/smtp?profile=orders")).json();
    const s = await (await call(smtpGET, "/api/admin/settings/smtp?profile=support")).json();
    expect(o.settings).toMatchObject({ user: "orders@cultraven.com", hasPassword: true, adminEmails: ["team@cultraven.com"] });
    expect(s.settings).toMatchObject({ user: "support@cultraven.com", hasPassword: true, adminEmails: [] });
    expect(JSON.stringify([o, s])).not.toMatch(/passwordab|passwordx/);
    expect((await call(smtpGET, "/api/admin/settings/smtp?profile=hacker")).status).toBe(400);
    expect((await call(smtpPUT, "/api/admin/settings/smtp?profile=hacker", { method: "PUT", body: ORDERS })).status).toBe(400);
  });
  it("with no profile named, the Orders mailbox is meant (so older screens keep working)", async () => {
    await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: ORDERS });
    expect(h.store.has("smtp")).toBe(true);
    expect(h.store.has("smtp-support")).toBe(false);
  });
  it("bad input is refused with a reason and nothing is saved", async () => {
    const bad: Record<string, unknown>[] = [
      { ...ORDERS, host: "bad host!" }, { ...ORDERS, host: "" }, { ...ORDERS, port: 0 }, { ...ORDERS, port: 70000 }, { ...ORDERS, port: "465" },
      { ...ORDERS, fromEmail: "not-an-email" }, { ...ORDERS, fromName: "" }, { ...ORDERS, user: "" }, { ...ORDERS, enabled: "yes" }, { ...ORDERS, adminEmails: "x".repeat(2000) },
    ];
    for (const body of bad) expect((await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body })).status).toBe(422);
    expect((await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: { ...box("orders@cultraven.com", "X"), pass: undefined } })).status).toBe(422); // first save needs a password
    expect(h.store.size).toBe(0);
  });
  it("double quotes and line breaks are stripped from the sender name (they could break the From header)", async () => {
    await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: { ...ORDERS, fromName: 'CULT"RAVEN\r\nBcc: x@y.z' } });
    expect(h.store.get("smtp").fromName).not.toMatch(/["\r\n]/);
  });
  it("the Support mailbox can't be used to change who gets the team alerts", async () => {
    await saveBoth();
    await call(smtpPUT, "/api/admin/settings/smtp?profile=support", { method: "PUT", body: { ...SUPPORT, pass: undefined, adminEmails: "sneaky@example.com" } });
    expect(h.store.get("smtp-support").adminEmails).toEqual([]);
    expect(h.store.get("smtp").adminEmails).toEqual(["team@cultraven.com"]);
  });
});

describe("scenario: the 'which mailbox sends what' overview", () => {
  it("before anything is set up: six kinds of email, none sending", async () => {
    const d = await (await call(routingGET, "/api/admin/settings/mail-routing")).json();
    expect(d.profiles.map((p: any) => [p.id, p.configured])).toEqual([["orders", false], ["support", false]]);
    expect(d.categories).toHaveLength(6);
    expect(d.categories.every((c: any) => c.using === null)).toBe(true);
  });
  it("with only Orders: order kinds use it; the others are 'covered by Orders' and flagged", async () => {
    await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: ORDERS });
    const d = await (await call(routingGET, "/api/admin/settings/mail-routing")).json();
    const c = (id: string) => d.categories.find((x: any) => x.id === id);
    expect(["order-confirmation", "order-updates", "order-alerts"].every((id) => c(id).using === "orders" && !c(id).fellBack)).toBe(true);
    expect(["support", "account", "staff"].every((id) => c(id).chosen === "support" && c(id).using === "orders" && c(id).fellBack && c(id).usingFrom === "orders@cultraven.com")).toBe(true);
    expect(d.adminEmails).toEqual(["team@cultraven.com"]);
  });
  it("with both: each kind reports the address really in use; it follows a change of routing and a paused mailbox", async () => {
    await saveBoth();
    let d = await (await call(routingGET, "/api/admin/settings/mail-routing")).json();
    expect(d.categories.find((x: any) => x.id === "account").usingFrom).toBe("support@cultraven.com");
    expect((await call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body: { routing: { account: "orders" } } })).status).toBe(200);
    d = await (await call(routingGET, "/api/admin/settings/mail-routing")).json();
    expect(d.categories.find((x: any) => x.id === "account")).toMatchObject({ chosen: "orders", usingFrom: "orders@cultraven.com", fellBack: false });
    await call(smtpPUT, "/api/admin/settings/smtp?profile=support", { method: "PUT", body: { ...SUPPORT, pass: undefined, enabled: false } });
    d = await (await call(routingGET, "/api/admin/settings/mail-routing")).json();
    expect(d.profiles[1]).toMatchObject({ configured: true, enabled: false });
    expect(d.categories.find((x: any) => x.id === "support")).toMatchObject({ chosen: "support", using: "orders", fellBack: true });
  });
  it("shows the last-30-days numbers per kind: sent, failed, skipped, when, and from which address", async () => {
    await saveBoth();
    h.aggRows.push(
      { _id: { kind: "order-customer", status: "sent" }, n: 7, last: new Date("2026-10-14T10:00:00Z"), lastFrom: "orders@cultraven.com" },
      { _id: { kind: "order-customer-resend", status: "sent" }, n: 1, last: new Date("2026-10-14T12:00:00Z"), lastFrom: "orders@cultraven.com" },
      { _id: { kind: "order-customer", status: "failed" }, n: 2, last: new Date("2026-10-13T10:00:00Z"), lastFrom: "orders@cultraven.com" },
      { _id: { kind: "welcome", status: "sent" }, n: 5, last: new Date("2026-10-14T09:00:00Z"), lastFrom: "support@cultraven.com" },
      { _id: { kind: "welcome", status: "skipped" }, n: 3, last: new Date("2026-10-01T09:00:00Z"), lastFrom: "" },
      { _id: { kind: "unknown-kind", status: "sent" }, n: 99, last: new Date(), lastFrom: "x" },
    );
    const d = await (await call(routingGET, "/api/admin/settings/mail-routing")).json();
    const c = (id: string) => d.categories.find((x: any) => x.id === id);
    expect(c("order-confirmation").stats).toEqual({ sent: 8, failed: 2, skipped: 0, lastAt: "2026-10-14T12:00:00.000Z", lastFrom: "orders@cultraven.com" });
    expect(c("account").stats).toMatchObject({ sent: 5, skipped: 3, lastFrom: "support@cultraven.com" });
    expect(c("staff").stats).toEqual({ sent: 0, failed: 0, skipped: 0, lastAt: null, lastFrom: "" });
    expect(JSON.stringify(d)).not.toContain("unknown-kind");
  });
  it("choosing a mailbox that isn't set up, an unknown kind, or an unknown mailbox is refused and nothing changes", async () => {
    await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: ORDERS });
    for (const routing of [{ account: "support" }, { bogus: "orders" }, { account: "accounting" }]) expect((await call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body: { routing } })).status).toBe(422);
    expect(h.store.has("mail-routing")).toBe(false);
  });
  it("the alert addresses: valid ones are kept, junk is dropped; refused until the Orders mailbox exists", async () => {
    expect((await call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body: { adminEmails: "a@example.com" } })).status).toBe(422);
    await call(smtpPUT, "/api/admin/settings/smtp", { method: "PUT", body: ORDERS });
    expect((await call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body: { adminEmails: "A@Example.com, not-an-email, a@example.com; b@example.com" } })).status).toBe(200);
    expect(h.store.get("smtp").adminEmails).toEqual(["a@example.com", "b@example.com"]);
  });
  it("garbage bodies are refused without a crash", async () => {
    for (const body of [null, 5, "x", [], { routing: 5 }, { routing: ["a"] }, { adminEmails: 5 }]) {
      const r = await call(routingPUT, "/api/admin/settings/mail-routing", { method: "PUT", body });
      expect([200, 400, 422]).toContain(r.status);
    }
  });
});

describe("scenario: the delivery check", () => {
  it("nothing saved: asks you to save first (400)", async () => {
    expect((await call(dnsGET, "/api/admin/settings/smtp/dns")).status).toBe(400);
  });
  it("two mailboxes on one domain: the domain is checked once; on two domains: each is checked", async () => {
    await saveBoth();
    let d = await (await call(dnsGET, "/api/admin/settings/smtp/dns")).json();
    expect(d.reports.map((r: any) => r.domain)).toEqual(["cultraven.com"]);
    await call(smtpPUT, "/api/admin/settings/smtp?profile=support", { method: "PUT", body: { ...SUPPORT, pass: undefined, fromEmail: "help@other-shop.in" } });
    h.dnsCalls.length = 0;
    d = await (await call(dnsGET, "/api/admin/settings/smtp/dns")).json();
    expect(d.reports.map((r: any) => r.domain).sort()).toEqual(["cultraven.com", "other-shop.in"]);
  });
  it("a DNS outage is reported as a temporary problem (502), never as 'records missing'", async () => {
    await saveBoth(); h.dnsFail = true;
    const r = await call(dnsGET, "/api/admin/settings/smtp/dns");
    expect(r.status).toBe(502);
    expect((await r.json()).error).toMatch(/Try again/);
  });
});

describe("scenario: sending a test email from one mailbox", () => {
  it("goes out through the chosen mailbox's own login, with the logo inside, and refuses a second test within 10 seconds", async () => {
    vi.useFakeTimers({ now: Date.now() + 60_000 });
    await saveBoth();
    const r = await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "me@example.com", profile: "support" } });
    expect(await r.json()).toMatchObject({ ok: true });
    expect(h.sent[0]).toMatchObject({ smtpUser: "support@cultraven.com", to: "me@example.com", from: '"CULTRAVEN Support" <support@cultraven.com>' });
    expect(h.sent[0].html).toContain("cid:cultraven-logo");
    expect(h.sent[0].attachments[0]).toMatchObject({ cid: "cultraven-logo" });
    expect((await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "me@example.com" } })).status).toBe(429);
    vi.setSystemTime(Date.now() + 11_000);
    expect((await (await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "me@example.com" } })).json()).ok).toBe(true);
    expect(h.sent[1].smtpUser).toBe("orders@cultraven.com");
    vi.useRealTimers();
  });
  it("a bad recipient, an unknown mailbox or an unsaved mailbox are refused", async () => {
    vi.useFakeTimers({ now: Date.now() + 3_600_000 });
    expect((await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "nope" } })).status).toBe(422);
    vi.setSystemTime(Date.now() + 11_000);
    expect((await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "a@b.co", profile: "hacker" } })).status).toBe(400);
    vi.setSystemTime(Date.now() + 11_000);
    expect((await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "a@b.co", profile: "support" } })).status).toBe(400);
    vi.useRealTimers();
  });
});

describe("scenario: the recent-emails list", () => {
  it("shows the sending address and the kind alongside each email, and never a password or a body", async () => {
    h.logs.push({ kind: "welcome", to: "a@example.com", subject: "Welcome", status: "sent", from: "support@cultraven.com", category: "account", error: "" });
    const d = await (await call(logsGET, "/api/admin/email-logs")).json();
    expect(d.logs[0]).toMatchObject({ kind: "welcome", from: "support@cultraven.com", category: "account", status: "sent" });
    expect(Object.keys(d.logs[0])).not.toContain("html");
  });
  it("older log rows without these fields still display", async () => {
    h.logs.push({ kind: "order-customer", to: "a@example.com", subject: "Hi", status: "sent" });
    const d = await (await call(logsGET, "/api/admin/email-logs")).json();
    expect(d.logs[0]).toMatchObject({ from: "", category: "" });
  });
});

describe("scenario: a wrong login is caught the moment it is saved", () => {
  const put = (body: Record<string, unknown>, profile = "orders") => call(smtpPUT, `/api/admin/settings/smtp?profile=${profile}`, { method: "PUT", body });

  it("a working login is saved and reported as verified", async () => {
    const r = await put(ORDERS);
    expect(await r.json()).toEqual({ success: true, check: { ok: true } });
  });
  it("a login Google refuses is still saved (so nothing is lost) but the admin is told straight away, in plain words", async () => {
    h.verifyFail = { code: "EAUTH", response: "535-5.7.8 Username and Password not accepted. https://support.google.com/mail/?p=BadCredentials abc - gsmtp" };
    const r = await put(ORDERS);
    const d = await r.json();
    expect(r.status).toBe(200);
    expect(d.success).toBe(true);
    expect(d.check.ok).toBe(false);
    expect(d.check.message).toMatch(/wrong or was revoked/);
    expect(JSON.stringify(d)).not.toMatch(/orderspasswordab/);
    expect(h.store.has("smtp")).toBe(true);
  });
  it("Google's 'new location' block is explained as such", async () => {
    h.verifyFail = { code: "EAUTH", response: "534-5.7.14 <https://accounts.google.com/signin/continue> Please log in via your web browser and then try again." };
    expect((await (await put(ORDERS)).json()).check.message).toMatch(/doesn't recognise/);
  });
  it("a mail server that doesn't answer in time doesn't hold up the save (the result is 'not confirmed', never a failure)", async () => {
    vi.useFakeTimers({ now: Date.now() + 120_000 });
    h.verifyFail = null;
    const nm = await import("nodemailer");
    const orig = nm.default.createTransport;
    (nm.default as any).createTransport = () => ({ verify: () => new Promise(() => {}), sendMail: async () => {} });
    const p = put(ORDERS);
    await vi.advanceTimersByTimeAsync(9000);
    const d = await (await p).json();
    (nm.default as any).createTransport = orig;
    vi.useRealTimers();
    expect(d.success).toBe(true);
    expect(d.check.ok).toBeNull();
    expect(d.check.message).toMatch(/press Send test/);
  });
  it("a paused mailbox isn't tested", async () => {
    h.verifyFail = { code: "EAUTH" };
    expect((await (await put({ ...ORDERS, enabled: false })).json()).check).toEqual({ ok: null });
  });
  it("the admin sign-in password can't be saved as a mailbox password (a browser filling in the wrong field)", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "Sup3rSecretAdminPw!");
    const r = await put({ ...ORDERS, host: "smtp.example.com", pass: "Sup3rSecretAdminPw!" });
    expect(r.status).toBe(422);
    expect((await r.json()).error).toMatch(/admin sign-in password/);
    expect(h.store.size).toBe(0);
  });
  it("a Gmail password must be a 16-letter App Password; spaces are fine and are removed", async () => {
    for (const bad of ["MyRegularPassw0rd!", "short", "abcd efgh ijkl", "abcdefghijklmnop1", "1234567890123456"]) {
      const r = await put({ ...ORDERS, pass: bad });
      expect(r.status).toBe(422);
      expect((await r.json()).error).toMatch(/16 letters/);
    }
    expect(h.store.size).toBe(0);
    expect((await put({ ...ORDERS, pass: "abcd efgh ijkl mnop" })).status).toBe(200);
    // the stored (scrambled) password decodes to the 16 letters with no spaces
    expect(Buffer.from(h.store.get("smtp").passEnc.replace("enc:", ""), "base64").toString()).toBe("abcdefghijklmnop");
  });
  it("other mail services keep their own password style (Brevo keys are long and mixed)", async () => {
    const r = await put({ ...ORDERS, host: "smtp-relay.brevo.com", port: 587, secure: false, pass: "xsmtpsib-0a1B2c3D4e5F6g7H8i9J-AbCdEfGhIjKlMn" });
    expect(r.status).toBe(200);
  });
  it("saving without a new password keeps the stored one and still checks the login", async () => {
    await put(ORDERS);
    h.verifyFail = { code: "EAUTH", response: "535-5.7.8 Username and Password not accepted" };
    const d = await (await put({ ...ORDERS, pass: undefined, fromName: "CULTRAVEN Orders" })).json();
    expect(d.check.ok).toBe(false);
    expect(h.store.get("smtp").fromName).toBe("CULTRAVEN Orders");
  });
  it("Send test now also reports Google's own reply", async () => {
    vi.useFakeTimers({ now: Date.now() + 7_200_000 });
    await put(ORDERS);
    h.verifyFail = { code: "EAUTH", response: "534-5.7.14 Please log in via your web browser" };
    const r = await call(testPOST, "/api/admin/settings/smtp/test", { method: "POST", body: { to: "me@example.com" } });
    const d = await r.json();
    vi.useRealTimers();
    expect(r.status).toBe(502);
    expect(d.detail).toMatch(/5\.7\.14/);
    expect(d.error).toMatch(/doesn't recognise/);
  });
});
