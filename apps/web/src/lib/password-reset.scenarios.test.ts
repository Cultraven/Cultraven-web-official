// @vitest-environment node
/**
 * Scenario tests for "Forgot password" and "set your password": the real token library and the real API routes, with the database
 * and the mail sender replaced by in-memory fakes. Each test is a situation a customer, an attacker or a clumsy click can create.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({ users: [] as any[], resets: [] as any[], mails: [] as any[], failHash: false, findOneCalls: 0, seq: 0 }));

const match = (doc: any, f: Record<string, any>) => Object.entries(f).every(([k, v]) => {
  if (v && typeof v === "object" && "$gt" in v) return doc[k] > v.$gt;
  if (v === null) return doc[k] === null || doc[k] === undefined;
  return String(doc[k]) === String(v);
});
const chain = (doc: any): any => ({ select: () => chain(doc), lean: async () => doc ?? null });

vi.mock("@/lib/db", () => ({ connectToDatabase: async () => {} }));
vi.mock("@/lib/models/PasswordReset", () => ({
  PasswordReset: {
    deleteMany: async (f: any) => { db.resets = db.resets.filter((d) => !match(d, f)); },
    create: async (doc: any) => { db.resets.push({ _id: `r${++db.seq}`, usedAt: null, ...doc }); },
    findOne: (f: any) => { db.findOneCalls++; return { lean: async () => db.resets.find((d) => match(d, f)) ?? null }; },
    // Applied immediately (like a real database does when the query runs); `upsert` creates the row when none matches — and because
    // JavaScript runs this without interruption, two "simultaneous" callers can never both create one (a unique index does this in Mongo).
    findOneAndUpdate: (f: any, u: any, opts: any = {}) => {
      const d = db.resets.find((x) => match(x, f));
      if (!d) { if (opts.upsert) db.resets.push({ _id: `r${++db.seq}`, usedAt: null, ...f, ...u.$set }); return { lean: async () => null }; }
      const before = { ...d }; Object.assign(d, u.$set);
      return { lean: async () => before };
    },
    updateOne: async (f: any, u: any) => { const d = db.resets.find((x) => match(x, f)); if (d) Object.assign(d, u.$set); },
  },
}));
vi.mock("@/lib/models/User", () => ({
  User: {
    findOne: (f: any) => chain(db.users.find((u) => u.email === f.email)),
    findById: (id: any) => chain(db.users.find((u) => String(u._id) === String(id))),
    updateOne: async (f: any, u: any) => { const d = db.users.find((x) => String(x._id) === String(f._id) && (f.deletedAt === null ? !x.deletedAt : true)); if (d) Object.assign(d, u.$set); },
  },
}));
vi.mock("@/lib/mailer", () => ({ sendMail: async (m: any) => { db.mails.push(m); return { ok: true }; }, getSmtpSettings: async () => ({ enabled: true, fromEmail: "orders@cultraven.com", adminEmails: [] }) }));
// bcrypt at cost 12 is slow and not what is under test here; the stand-in keeps the password recognisable
vi.mock("@/lib/password", async (orig) => {
  const real = await orig<typeof import("@/lib/password")>();
  return { ...real, hashPassword: async (p: string) => { if (db.failHash) throw new Error("hash failed"); return `hash:${p}`; } };
});

import { issueToken, inspectToken, consumeToken, releaseToken, sendResetEmailFor, sendPasswordChangedEmail, hashToken, newToken, RESET_TTL_MINUTES, INVITE_TTL_HOURS } from "./password-reset";
import { rateLimitPeek, recordHit } from "./sanitize";
import { POST as resetPOST, GET as resetGET } from "../app/api/auth/reset-password/route";
import { POST as forgotPOST, GET as forgotGET } from "../app/api/auth/forgot-password/route";

let ipSeq = 0;
const freshIp = () => `10.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}.${(ipSeq * 7) % 250 + 1}`;
const req = (path: string, body: unknown, over: { ip?: string; origin?: string | null; method?: string; raw?: string } = {}) => {
  const headers: Record<string, string> = { "content-type": "application/json", host: "localhost", "x-forwarded-for": over.ip ?? freshIp() };
  if (over.origin !== null) headers.origin = over.origin ?? "http://localhost";
  return new NextRequest(`http://localhost${path}`, { method: over.method ?? "POST", headers, body: over.raw ?? JSON.stringify(body) });
};
const reset = (body: unknown, over = {}) => resetPOST(req("/api/auth/reset-password", body, over));
const forgot = (body: unknown, over = {}) => forgotPOST(req("/api/auth/forgot-password", body, over));
const mkUser = (o: Record<string, unknown> = {}) => { const u = { _id: `u${db.users.length + 1}`, firstName: "Asha", email: `asha${db.users.length + 1}@example.com`, role: "customer", status: "active", deletedAt: null, passwordHash: "hash:Old", ...o }; db.users.push(u); return u; };
const STRONG = "BrandNewPassw0rd!";
const mailsTo = (email: string) => db.mails.filter((m) => m.to === email);
const tokenOf = (m: { text: string }) => /reset-password\?token=([A-Za-z0-9_-]{43})/.exec(m.text)?.[1] as string;

beforeEach(() => { db.users.length = 0; db.resets.length = 0; db.mails.length = 0; db.failHash = false; db.findOneCalls = 0; vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cultraven.com"); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("scenario: a reset link in the hands of whoever clicks it", () => {
  it("works exactly once", async () => {
    const u = mkUser();
    const { token } = await issueToken(u._id, "reset");
    expect(await inspectToken(token)).toEqual({ userId: u._id, purpose: "reset" });
    expect(await consumeToken(token)).toMatchObject({ userId: u._id, purpose: "reset" });
    expect(await consumeToken(token)).toBeNull();
    expect(await inspectToken(token)).toBeNull();
  });
  it("only a hash of the token is ever stored", async () => {
    const u = mkUser();
    const { token } = await issueToken(u._id, "reset");
    expect(JSON.stringify(db.resets)).not.toContain(token);
    expect(db.resets[0].tokenHash).toBe(hashToken(token));
  });
  it("a forgot-password link dies after 30 minutes; a new-account link after 48 hours", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-15T10:00:00Z") });
    const u = mkUser();
    const a = await issueToken(u._id, "reset"), b = await issueToken(u._id, "invite");
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z").getTime() + (RESET_TTL_MINUTES - 1) * 60_000);
    expect(await inspectToken(a.token)).not.toBeNull();
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z").getTime() + (RESET_TTL_MINUTES + 1) * 60_000);
    expect(await inspectToken(a.token)).toBeNull();
    expect(await consumeToken(a.token)).toBeNull();
    expect(await inspectToken(b.token)).not.toBeNull();
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z").getTime() + (INVITE_TTL_HOURS - 1) * 3_600_000);
    expect(await inspectToken(b.token)).not.toBeNull();
    vi.setSystemTime(new Date("2026-10-15T10:00:00Z").getTime() + (INVITE_TTL_HOURS + 1) * 3_600_000);
    expect(await inspectToken(b.token)).toBeNull();
  });
  it("asking for a new link cancels the old one (but a staff invite and a reset can both be pending)", async () => {
    const u = mkUser();
    const first = await issueToken(u._id, "reset"), invite = await issueToken(u._id, "invite");
    const second = await issueToken(u._id, "reset");
    expect(await inspectToken(first.token)).toBeNull();
    expect(await inspectToken(second.token)).not.toBeNull();
    expect(await inspectToken(invite.token)).not.toBeNull();
  });
  it("two people clicking 'forgot password' for the same account at the same instant end up with exactly one working link", async () => {
    const u = mkUser();
    const issued = await Promise.all(Array.from({ length: 6 }, () => issueToken(u._id, "reset")));
    expect(db.resets.filter((r) => r.purpose === "reset")).toHaveLength(1);
    const working = (await Promise.all(issued.map((i) => inspectToken(i.token)))).filter(Boolean);
    expect(working).toHaveLength(1);
  });
  it("one person's new link never cancels another person's", async () => {
    const a = mkUser(), b = mkUser();
    const ta = await issueToken(a._id, "reset"); await issueToken(b._id, "reset");
    expect(await inspectToken(ta.token)).not.toBeNull();
  });
  it("a link that was claimed but whose password could not be saved can be handed back and used again", async () => {
    const u = mkUser();
    const { token } = await issueToken(u._id, "reset");
    const claim = await consumeToken(token);
    expect(await inspectToken(token)).toBeNull();
    await releaseToken(claim!.id);
    expect(await inspectToken(token)).not.toBeNull();
  });
  it("junk never reaches the database: wrong length, wrong characters, injection attempts", async () => {
    for (const junk of ["", "short", "x".repeat(42), "x".repeat(44), `${"x".repeat(42)}!`, "{\"$ne\":null}", "../".repeat(15), `${newToken()}\n`]) {
      expect(await inspectToken(junk)).toBeNull();
      expect(await consumeToken(junk)).toBeNull();
    }
    expect(db.findOneCalls).toBe(0);
  });
  it("a made-up token with the right shape finds nothing", async () => {
    mkUser();
    expect(await inspectToken(newToken())).toBeNull();
    expect(await consumeToken(newToken())).toBeNull();
  });
});

describe("scenario: who gets a reset email", () => {
  it("a customer gets one email with a working 30-minute link, from the support address, never containing a password", async () => {
    const u = mkUser({ email: "asha@example.com" });
    await sendResetEmailFor("asha@example.com", "1.2.3.4");
    expect(db.mails).toHaveLength(1);
    const m = db.mails[0];
    expect(m).toMatchObject({ to: "asha@example.com", kind: "password-reset", replyTo: "support@cultraven.com", subject: "Reset your CULTRAVEN password" });
    expect(m.html).toContain("30 minutes");
    expect(m.html).toContain(`href="https://cultraven.com/reset-password?token=${tokenOf(m)}"`);
    expect(await inspectToken(tokenOf(m))).toEqual({ userId: u._id, purpose: "reset" });
    expect(m.html + m.text).not.toMatch(/hash:|passwordHash/);
  });
  it("a delivery partner gets one too", async () => {
    mkUser({ email: "ravi@example.com", role: "delivery" });
    await sendResetEmailFor("ravi@example.com", "1.2.3.4");
    expect(mailsTo("ravi@example.com")).toHaveLength(1);
  });
  it.each([["admin", "admin"], ["superadmin", "superadmin"]])("an %s account gets nothing from the public page (admin passwords are changed in the panel)", async (_n, role) => {
    mkUser({ email: "boss@example.com", role });
    await sendResetEmailFor("boss@example.com", "1.2.3.4");
    expect(db.mails).toHaveLength(0);
    expect(db.resets).toHaveLength(0);
  });
  it("nobody gets one for an address we don't know, a deleted account, or a soft-deleted status", async () => {
    mkUser({ email: "gone@example.com", deletedAt: new Date() });
    mkUser({ email: "gone2@example.com", status: "deleted" });
    for (const e of ["nobody@example.com", "gone@example.com", "gone2@example.com"]) await sendResetEmailFor(e, "1.2.3.4");
    expect(db.mails).toHaveLength(0);
    expect(db.resets).toHaveLength(0);
  });
  it("the 'password changed' notice goes to active accounts only, with the right sign-in page", async () => {
    mkUser({ email: "c@example.com" }); mkUser({ email: "d@example.com", role: "delivery" }); mkUser({ email: "a@example.com", role: "admin" }); mkUser({ email: "x@example.com", deletedAt: new Date() });
    for (const u of db.users) await sendPasswordChangedEmail(u._id);
    expect(db.mails.map((m) => m.to).sort()).toEqual(["a@example.com", "c@example.com", "d@example.com"]);
    expect(mailsTo("c@example.com")[0].html).toContain('href="https://cultraven.com/login"');
    expect(mailsTo("d@example.com")[0].html).toContain('href="https://cultraven.com/portal-delivery-access"');
    expect(mailsTo("a@example.com")[0].html).toContain('href="https://cultraven.com/portal-access"');
    await sendPasswordChangedEmail("nobody");
    expect(db.mails).toHaveLength(3);
  });
});

describe("scenario: choosing the new password (POST /api/auth/reset-password)", () => {
  it("the happy path: password changed, other devices signed out, link used up, confirmation email sent", async () => {
    const u = mkUser({ email: "asha@example.com" });
    const { token } = await issueToken(u._id, "reset");
    const before = Date.now();
    const r = await reset({ token, password: STRONG });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, loginPath: "/login" });
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(u.passwordHash).toBe(`hash:${STRONG}`);
    expect(new Date((u as any).passwordChangedAt).getTime()).toBeGreaterThanOrEqual(before);
    expect((u as any).emailVerified).toBe(true);
    expect(await inspectToken(token)).toBeNull();
    await vi.waitFor(() => expect(mailsTo("asha@example.com")).toHaveLength(1));
    expect(mailsTo("asha@example.com")[0].subject).toBe("Your CULTRAVEN password was changed");
  });
  it("sends each kind of account to its own sign-in page", async () => {
    for (const [role, path] of [["customer", "/login"], ["delivery", "/portal-delivery-access"], ["admin", "/portal-access"], ["superadmin", "/portal-access"]]) {
      const u = mkUser({ role });
      const { token } = await issueToken(u._id, "invite");
      const r = await reset({ token, password: STRONG });
      expect((await r.json()).loginPath).toBe(path);
    }
  });
  it("a weak password is refused with the reason — and the link is NOT used up by the mistake", async () => {
    const u = mkUser();
    const { token } = await issueToken(u._id, "reset");
    for (const weak of ["short1A", "alllowercase1", "ALLUPPERCASE1", "NoNumbersHere", "a".repeat(200)]) {
      const r = await reset({ token, password: weak });
      expect(r.status).toBe(422);
      expect(typeof (await r.json()).error).toBe("string");
    }
    expect(await inspectToken(token)).not.toBeNull();
    expect(u.passwordHash).toBe("hash:Old");
    expect((await reset({ token, password: STRONG })).status).toBe(200);
  });
  it("every kind of dead link gets the same answer, so nothing can be learned from it", async () => {
    const u = mkUser();
    const used = await issueToken(u._id, "reset"); await consumeToken(used.token);
    vi.useFakeTimers({ now: Date.now() });
    const old = await issueToken(mkUser()._id, "reset"); vi.setSystemTime(Date.now() + 31 * 60_000);
    const deleted = mkUser({ deletedAt: new Date() }); const dead = await issueToken(deleted._id, "reset"); // still inside its time, but the account is gone
    const answers = new Set<string>();
    for (const token of [used.token, old.token, newToken(), "garbage", "", dead.token]) {
      const r = await reset({ token, password: STRONG });
      expect(r.status).toBe(400);
      answers.add(JSON.stringify(await r.json()));
    }
    expect(answers.size).toBe(1);
    expect([...answers][0]).toMatch(/expired or was already used/);
  });
  it("a missing token or a missing password is refused, not crashed on", async () => {
    expect((await reset({})).status).toBe(400);
    expect((await reset({ password: STRONG })).status).toBe(400);
    const { token } = await issueToken(mkUser()._id, "reset");
    expect((await reset({ token })).status).toBe(422);
    expect((await reset({ token, password: 12345678 })).status).toBe(422);
    expect((await reset({ token, password: ["a"] })).status).toBe(422);
    expect((await reset({ token: { $ne: null }, password: STRONG })).status).toBe(400);
  });
  it("if saving fails after the link was claimed, the person can simply try again with the same link", async () => {
    const u = mkUser();
    const { token } = await issueToken(u._id, "reset");
    db.failHash = true;
    expect((await reset({ token, password: STRONG })).status).toBe(500);
    expect(await inspectToken(token)).not.toBeNull();
    db.failHash = false;
    expect((await reset({ token, password: STRONG })).status).toBe(200);
  });
  it("five simultaneous clicks on one link: exactly one succeeds", async () => {
    const u = mkUser();
    const { token } = await issueToken(u._id, "reset");
    const codes = (await Promise.all([1, 2, 3, 4, 5].map((i) => reset({ token, password: `Winner${i}Passw0rd` })))).map((r) => r.status);
    expect(codes.filter((c) => c === 200)).toHaveLength(1);
    expect(codes.filter((c) => c === 400)).toHaveLength(4);
    expect(u.passwordHash).toMatch(/^hash:Winner\dPassw0rd$/);
  });
  it("a successful reset cancels every other pending link and releases a login lock", async () => {
    const u = mkUser({ email: "lock@example.com" });
    const invite = await issueToken(u._id, "invite");
    const { token } = await issueToken(u._id, "reset");
    for (let i = 0; i < 5; i++) recordHit("login-fail:lock@example.com", 15 * 60_000);
    expect(rateLimitPeek("login-fail:lock@example.com", 5, 15 * 60_000).ok).toBe(false);
    expect((await reset({ token, password: STRONG })).status).toBe(200);
    expect(await inspectToken(invite.token)).toBeNull();
    expect(rateLimitPeek("login-fail:lock@example.com", 5, 15 * 60_000).ok).toBe(true);
  });
  it("only same-site browsers may call it; wrong methods and broken bodies are refused", async () => {
    const { token } = await issueToken(mkUser()._id, "reset");
    expect((await reset({ token, password: STRONG }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await reset({}, { raw: "not json" })).status).toBe(400);
    expect((await reset({}, { raw: JSON.stringify({ token, password: "A1" + "b".repeat(5000) }) })).status).toBeGreaterThanOrEqual(400);
    expect((await resetGET()).status).toBe(405);
    expect(await inspectToken(token)).not.toBeNull();
  });
  it("guessing is throttled: the 11th try from one address in 15 minutes is refused with Retry-After", async () => {
    const ip = freshIp();
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) codes.push((await reset({ token: newToken(), password: STRONG }, { ip })).status);
    expect(codes.slice(0, 10).every((c) => c === 400)).toBe(true);
    expect(codes[10]).toBe(429);
    const r = await reset({ token: newToken(), password: STRONG }, { ip });
    expect(r.status).toBe(429);
    expect(Number(r.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

describe("scenario: asking for a link (POST /api/auth/forgot-password)", () => {
  it("looks identical to everyone — real customer, stranger, garbage, admin, deleted — and only the real customer gets mail", async () => {
    mkUser({ email: "real@example.com" }); mkUser({ email: "boss@example.com", role: "admin" }); mkUser({ email: "gone@example.com", deletedAt: new Date() });
    const bodies = new Set<string>();
    for (const email of ["real@example.com", "stranger@example.com", "not an email", "boss@example.com", "gone@example.com", "", "a@b"]) {
      const r = await forgot({ email });
      expect(r.status).toBe(200);
      bodies.add(JSON.stringify(await r.json()));
    }
    expect(bodies.size).toBe(1);
    expect([...bodies][0]).toBe('{"ok":true}');
    await vi.waitFor(() => expect(mailsTo("real@example.com")).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(db.mails).toHaveLength(1);
  });
  it("upper-case or padded addresses still find the account", async () => {
    mkUser({ email: "asha@example.com" });
    await forgot({ email: "  ASHA@Example.COM " });
    await vi.waitFor(() => expect(mailsTo("asha@example.com")).toHaveLength(1));
  });
  it("one address can't be flooded: five requests from five places send at most three emails", async () => {
    mkUser({ email: "target@example.com" });
    for (let i = 0; i < 5; i++) expect((await forgot({ email: "target@example.com" })).status).toBe(200);
    await new Promise((r) => setTimeout(r, 100));
    expect(mailsTo("target@example.com").length).toBeLessThanOrEqual(3);
    expect(mailsTo("target@example.com").length).toBeGreaterThanOrEqual(1);
    expect(db.resets.filter((r) => r.purpose === "reset")).toHaveLength(1); // only the newest link stays valid
  });
  it("one address (IP) can't be used to mail many people: only the first three requests are acted on", async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) { mkUser({ email: `v${i}@example.com` }); await forgot({ email: `v${i}@example.com` }, { ip }); }
    await new Promise((r) => setTimeout(r, 100));
    expect(db.mails).toHaveLength(3);
  });
  it("only same-site browsers may call it; GET is refused; broken bodies are refused", async () => {
    expect((await forgot({ email: "a@example.com" }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await forgot({}, { raw: "{" })).status).toBe(400);
    expect((await forgotGET()).status).toBe(405);
  });
  it("the whole flow: ask, click the emailed link, choose a password, get the confirmation", async () => {
    const u = mkUser({ email: "flow@example.com" });
    await forgot({ email: "flow@example.com" });
    await vi.waitFor(() => expect(mailsTo("flow@example.com")).toHaveLength(1));
    const token = tokenOf(mailsTo("flow@example.com")[0]);
    expect((await reset({ token, password: STRONG })).status).toBe(200);
    expect(u.passwordHash).toBe(`hash:${STRONG}`);
    await vi.waitFor(() => expect(mailsTo("flow@example.com")).toHaveLength(2));
    expect(mailsTo("flow@example.com")[1].subject).toBe("Your CULTRAVEN password was changed");
    expect((await reset({ token, password: "AnotherPassw0rd" })).status).toBe(400);
  });
});
