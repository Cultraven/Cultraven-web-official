// @vitest-environment node
/**
 * Scenario tests for the mailer: real situations, run through the real sendMail / settings code with the database and the SMTP
 * server replaced by in-memory fakes, so every outcome can be checked — which mailbox sent it, what was logged, what was retried.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  store: new Map<string, any>(),
  logs: [] as any[],
  sent: [] as any[],
  attempts: 0,
  failures: [] as string[], // error codes to throw on the next send attempts, in order
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
  EmailLog: { create: async (e: unknown) => { h.logs.push(e); } },
}));
// A stand-in cipher: the stored form is scrambled (base64), so a test can tell "stored encrypted" from "stored as typed".
vi.mock("@/lib/secret-box", () => ({ encryptSecret: (s: string) => `enc:${Buffer.from(s).toString("base64")}`, decryptSecret: (s: string) => (typeof s === "string" && s.startsWith("enc:") ? Buffer.from(s.slice(4), "base64").toString() : "") }));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: (opts: { auth: { user: string } }) => ({
      sendMail: async (m: Record<string, unknown>) => {
        h.attempts++;
        const f = h.failures.shift();
        if (f) throw Object.assign(new Error(f), { code: f });
        h.sent.push({ ...m, smtpUser: opts.auth.user });
      },
    }),
  },
}));

import { sendMail, saveSmtpSettings, getPublicSmtpSettings, getSmtpSettings, saveMailRouting, getMailRouting, saveAlertEmails, type MailInput } from "./mailer";

const ORDERS = { enabled: true, host: "smtp.gmail.com", port: 465, secure: true, user: "orders@cultraven.com", pass: "orders-secret-123", fromName: "CULTRAVEN", fromEmail: "orders@cultraven.com", adminEmails: ["team@cultraven.com", "boss@cultraven.com"] };
const SUPPORT = { enabled: true, host: "smtp.gmail.com", port: 465, secure: true, user: "support@cultraven.com", pass: "support-secret-456", fromName: "CULTRAVEN Support", fromEmail: "support@cultraven.com" };
const mail = (kind: string, extra: Partial<MailInput> = {}): MailInput => ({ to: "asha@example.com", subject: "Hello", html: '<p>Hi</p><img src="https://cultraven.com/email-logo.png" alt="CULTRAVEN">', text: "Hi", kind, ...extra });
const ALL_KINDS = ["order-customer", "order-customer-resend", "order-status-shipped", "order-admin", "admin-cancelled", "support-ack", "support-admin", "welcome", "password-reset", "password-changed", "staff_account_created", "delivery_kyc_submitted", "delivery_kyc_decision"];
const ORDER_KINDS = ["order-customer", "order-customer-resend", "order-status-shipped", "order-admin", "admin-cancelled"];
const SUPPORT_KINDS = ["support-ack", "support-admin", "welcome", "password-reset", "password-changed", "staff_account_created", "delivery_kyc_submitted", "delivery_kyc_decision"];

beforeEach(() => { h.store.clear(); h.logs.length = 0; h.sent.length = 0; h.attempts = 0; h.failures.length = 0; for (const k of Object.keys(process.env)) if (k.startsWith("SMTP_")) vi.stubEnv(k, ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("scenario: nothing is set up yet", () => {
  it("no email is sent, every attempt is logged as skipped with the reason, and nothing throws", async () => {
    for (const kind of ALL_KINDS) expect(await sendMail(mail(kind))).toEqual({ ok: false, error: "SMTP not configured" });
    expect(h.sent).toHaveLength(0);
    expect(h.logs).toHaveLength(ALL_KINDS.length);
    expect(h.logs.every((l) => l.status === "skipped" && l.error === "SMTP not configured")).toBe(true);
  });
});

describe("scenario: today's production — only the Orders mailbox", () => {
  beforeEach(async () => { await saveSmtpSettings(ORDERS); });

  it("every kind of email goes out through the Orders mailbox", async () => {
    for (const kind of ALL_KINDS) expect((await sendMail(mail(kind))).ok).toBe(true);
    expect(h.sent).toHaveLength(ALL_KINDS.length);
    expect(h.sent.every((m) => m.smtpUser === "orders@cultraven.com" && m.from === '"CULTRAVEN" <orders@cultraven.com>')).toBe(true);
  });
  it("each attempt is logged with the sending address and the kind of email", async () => {
    await sendMail(mail("welcome")); await sendMail(mail("order-customer", { orderId: "abc" }));
    expect(h.logs.map((l) => [l.kind, l.status, l.from, l.category])).toEqual([["welcome", "sent", "orders@cultraven.com", "account"], ["order-customer", "sent", "orders@cultraven.com", "order-confirmation"]]);
    expect(h.logs[1].orderId).toBe("abc");
  });
  it("replies go to the sending mailbox unless the caller chose another address", async () => {
    await sendMail(mail("order-customer")); await sendMail(mail("support-admin", { replyTo: "customer@example.com" }));
    expect(h.sent[0].replyTo).toBe("orders@cultraven.com");
    expect(h.sent[1].replyTo).toBe("customer@example.com");
  });
  it("the logo is attached inside the email and the website link is gone; other attachments are kept", async () => {
    await sendMail(mail("order-customer", { attachments: [{ filename: "receipt.pdf", content: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" }] }));
    const m = h.sent[0];
    expect(m.html).toContain('src="cid:cultraven-logo"');
    expect(m.html).not.toContain("/email-logo.png");
    expect(m.attachments.map((a: any) => a.filename)).toEqual(["cultraven-logo.png", "receipt.pdf"]);
    expect(m.attachments[0]).toMatchObject({ cid: "cultraven-logo", contentDisposition: "inline" });
  });
  it("a kind of email nobody has heard of still goes out, via Orders, with no category", async () => {
    expect((await sendMail(mail("something-new"))).ok).toBe(true);
    expect(h.logs[0]).toMatchObject({ category: "", from: "orders@cultraven.com" });
  });
});

describe("scenario: both mailboxes", () => {
  beforeEach(async () => { await saveSmtpSettings(ORDERS); await saveSmtpSettings(SUPPORT, "support"); });

  it("by default order emails use Orders; contact-form, account and staff emails use Support", async () => {
    for (const kind of ALL_KINDS) await sendMail(mail(kind));
    for (const m of h.sent) {
      const kind = ALL_KINDS[h.sent.indexOf(m)];
      expect(m.smtpUser).toBe(ORDER_KINDS.includes(kind) ? "orders@cultraven.com" : "support@cultraven.com");
    }
    expect(SUPPORT_KINDS.every((k) => h.sent[ALL_KINDS.indexOf(k)].from === '"CULTRAVEN Support" <support@cultraven.com>')).toBe(true);
  });
  it("replies to a Support email go to the Support mailbox", async () => {
    await sendMail(mail("welcome"));
    expect(h.sent[0].replyTo).toBe("support@cultraven.com");
  });
  it("the admin can move a kind of email to the other mailbox — and back", async () => {
    await saveMailRouting({ account: "orders", "order-alerts": "support" });
    await sendMail(mail("welcome")); await sendMail(mail("order-admin"));
    expect(h.sent.map((m) => m.smtpUser)).toEqual(["orders@cultraven.com", "support@cultraven.com"]);
    await saveMailRouting({});
    await sendMail(mail("welcome"));
    expect(h.sent[2].smtpUser).toBe("support@cultraven.com");
  });
  it("saved routing ignores unknown kinds and unknown mailboxes", async () => {
    await saveMailRouting({ account: "orders", bogus: "orders", support: "nobody" } as never);
    expect(await getMailRouting()).toEqual({ account: "orders" });
  });
  it("each mailbox keeps its own password; neither is ever shown", async () => {
    const o = await getPublicSmtpSettings("orders"), s = await getPublicSmtpSettings("support");
    expect(o).toMatchObject({ user: "orders@cultraven.com", hasPassword: true });
    expect(s).toMatchObject({ user: "support@cultraven.com", hasPassword: true });
    expect(JSON.stringify([o, s])).not.toMatch(/secret/);
    expect((await getSmtpSettings("support"))!.pass).toBe("support-secret-456");
    expect((await getSmtpSettings("orders"))!.pass).toBe("orders-secret-123");
  });
  it("passwords are stored encrypted, never in clear text", () => {
    expect(JSON.stringify([...h.store.values()])).not.toMatch(/orders-secret-123|support-secret-456/);
  });
});

describe("scenario: a mailbox is paused", () => {
  it("a paused Support mailbox: its emails are sent from Orders instead, and the log says which address really sent them", async () => {
    await saveSmtpSettings(ORDERS); await saveSmtpSettings({ ...SUPPORT, enabled: false }, "support");
    for (const kind of SUPPORT_KINDS) await sendMail(mail(kind));
    expect(h.sent).toHaveLength(SUPPORT_KINDS.length);
    expect(h.sent.every((m) => m.smtpUser === "orders@cultraven.com")).toBe(true);
    expect(h.logs.every((l) => l.status === "sent" && l.from === "orders@cultraven.com")).toBe(true);
  });
  it("a paused Orders mailbox: order emails are skipped (not quietly moved to Support), but support emails still go out", async () => {
    await saveSmtpSettings({ ...ORDERS, enabled: false }); await saveSmtpSettings(SUPPORT, "support");
    for (const kind of ORDER_KINDS) expect((await sendMail(mail(kind))).ok).toBe(false);
    for (const kind of SUPPORT_KINDS) expect((await sendMail(mail(kind))).ok).toBe(true);
    expect(h.sent.every((m) => m.smtpUser === "support@cultraven.com")).toBe(true);
    expect(h.logs.filter((l) => l.status === "skipped").every((l) => l.error === "Email disabled")).toBe(true);
    expect(h.logs.filter((l) => l.status === "skipped")).toHaveLength(ORDER_KINDS.length);
  });
  it("both paused: everything is skipped as 'Email disabled'", async () => {
    await saveSmtpSettings({ ...ORDERS, enabled: false }); await saveSmtpSettings({ ...SUPPORT, enabled: false }, "support");
    for (const kind of ALL_KINDS) expect((await sendMail(mail(kind))).ok).toBe(false);
    expect(h.sent).toHaveLength(0);
    expect(h.logs.every((l) => l.status === "skipped" && l.error === "Email disabled")).toBe(true);
  });
  it("only Support is saved (Orders never was): order emails are skipped as 'not configured'", async () => {
    await saveSmtpSettings(SUPPORT, "support");
    expect((await sendMail(mail("order-customer"))).ok).toBe(false);
    expect(h.logs[0]).toMatchObject({ status: "skipped", error: "SMTP not configured" });
    expect((await sendMail(mail("welcome"))).ok).toBe(true);
  });
});

describe("scenario: the mail server has a bad moment", () => {
  beforeEach(async () => { await saveSmtpSettings(ORDERS); vi.useFakeTimers(); });

  it("one failure is retried and the email still goes out (logged once, as sent)", async () => {
    h.failures.push("ETIMEDOUT");
    const p = sendMail(mail("order-customer"));
    await vi.advanceTimersByTimeAsync(1600);
    expect(await p).toEqual({ ok: true });
    expect(h.attempts).toBe(2);
    expect(h.sent).toHaveLength(1);
    expect(h.logs).toHaveLength(1);
    expect(h.logs[0].status).toBe("sent");
  });
  it("two failures in a row: logged once as failed with the reason, the caller gets { ok: false } and nothing is thrown", async () => {
    h.failures.push("EAUTH", "EAUTH");
    const p = sendMail(mail("order-customer"));
    await vi.advanceTimersByTimeAsync(1600);
    expect(await p).toEqual({ ok: false, error: "EAUTH" });
    expect(h.attempts).toBe(2);
    expect(h.logs).toHaveLength(1);
    expect(h.logs[0]).toMatchObject({ status: "failed", error: "EAUTH", from: "orders@cultraven.com" });
  });
  it("a very long error message is cut short in the log, and never contains the password", async () => {
    h.failures.push("x".repeat(2000), "y".repeat(2000));
    const p = sendMail(mail("welcome"));
    await vi.advanceTimersByTimeAsync(1600);
    await p;
    expect(h.logs[0].error.length).toBeLessThanOrEqual(300);
    expect(JSON.stringify(h.logs)).not.toContain("orders-secret-123");
  });
  it("ten emails at once, one of which fails twice: the other nine are unaffected", async () => {
    h.failures.push("ECONNRESET", "ECONNRESET");
    const all = Promise.all(Array.from({ length: 10 }, (_, i) => sendMail(mail("order-status-shipped", { to: `c${i}@example.com` }))));
    await vi.advanceTimersByTimeAsync(2000);
    const results = await all;
    expect(results.filter((r) => r.ok).length).toBeGreaterThanOrEqual(8);
    expect(h.logs).toHaveLength(10);
  });
});

describe("scenario: saving mailbox settings", () => {
  it("the first save needs a password; later saves may leave it blank and keep the stored one", async () => {
    const { pass: _p, ...noPass } = ORDERS;
    await expect(saveSmtpSettings(noPass)).rejects.toThrow(/password is required/i);
    await saveSmtpSettings(ORDERS);
    await saveSmtpSettings({ ...noPass, fromName: "CULTRAVEN Orders" });
    const s = (await getSmtpSettings())!;
    expect(s.pass).toBe("orders-secret-123");
    expect(s.fromName).toBe("CULTRAVEN Orders");
  });
  it("changing the password replaces it", async () => {
    await saveSmtpSettings(ORDERS); await saveSmtpSettings({ ...ORDERS, pass: "new-pass-789" });
    expect((await getSmtpSettings())!.pass).toBe("new-pass-789");
  });
  it("saving the Orders mailbox without the alert list keeps the alert addresses; the Support mailbox never stores any", async () => {
    await saveSmtpSettings(ORDERS);
    const { adminEmails: _a, ...noAlerts } = ORDERS;
    await saveSmtpSettings({ ...noAlerts, port: 587, secure: false });
    expect((await getSmtpSettings())!.adminEmails).toEqual(["team@cultraven.com", "boss@cultraven.com"]);
    await saveSmtpSettings({ ...SUPPORT, adminEmails: ["sneaky@example.com"] }, "support");
    expect((await getSmtpSettings("support"))!.adminEmails).toEqual([]);
  });
  it("alert addresses can be replaced once the Orders mailbox exists — not before", async () => {
    expect(await saveAlertEmails(["a@example.com"])).toBe(false);
    await saveSmtpSettings(ORDERS);
    expect(await saveAlertEmails(["new@example.com"])).toBe(true);
    expect((await getSmtpSettings())!.adminEmails).toEqual(["new@example.com"]);
  });
  it("a broken record (no password inside) is treated as 'not set up', not as a crash", async () => {
    h.store.set("smtp", { enabled: true, host: "smtp.gmail.com", user: "orders@cultraven.com", passEnc: "garbage" });
    expect(await getSmtpSettings()).toBeNull();
    expect((await sendMail(mail("order-customer"))).ok).toBe(false);
  });
});

describe("scenario: settings that live in the server environment (no admin record yet)", () => {
  it("the Orders mailbox is read from SMTP_* variables; Support never is", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com"); vi.stubEnv("SMTP_USER", "orders@cultraven.com"); vi.stubEnv("SMTP_PASS", "env-pass"); vi.stubEnv("SMTP_PORT", "465");
    expect((await getSmtpSettings())!).toMatchObject({ user: "orders@cultraven.com", pass: "env-pass", port: 465, secure: true, fromName: "CULTRAVEN" });
    expect(await getSmtpSettings("support")).toBeNull();
    await sendMail(mail("welcome"));
    expect(h.sent[0].smtpUser).toBe("orders@cultraven.com"); // support-type email, covered by Orders
  });
  it("an admin-saved mailbox wins over the environment", async () => {
    vi.stubEnv("SMTP_HOST", "env.example.com"); vi.stubEnv("SMTP_USER", "env@example.com"); vi.stubEnv("SMTP_PASS", "env-pass");
    await saveSmtpSettings(ORDERS);
    expect((await getSmtpSettings())!.user).toBe("orders@cultraven.com");
  });
});
