/**
 * Outbound email (SMTP via nodemailer). Settings come from the admin panel (MongoDB, password encrypted);
 * SMTP_* environment variables are the fallback. Sending NEVER throws into the caller: an order must not
 * fail because a mail server is down. Every attempt is logged to EmailLog.
 */
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/db";
import { Setting, EmailLog } from "@/lib/models/Setting";
import { encryptSecret, decryptSecret } from "@/lib/secret-box";

export interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean; // true = implicit TLS (465); false = STARTTLS (587)
  user: string;
  pass: string; // decrypted — never return this to the browser
  fromName: string;
  fromEmail: string;
  adminEmails: string[];
}

export interface PublicSmtpSettings extends Omit<SmtpSettings, "pass"> { hasPassword: boolean }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL.test(v) && v.length <= 254;

/** Split "a@x.com, b@y.com" into a clean, de-duplicated list of valid addresses. */
export function parseEmailList(v: string | string[] | undefined): string[] {
  const parts = Array.isArray(v) ? v : String(v ?? "").split(/[,;\s]+/);
  return Array.from(new Set(parts.map((p) => p.trim().toLowerCase()).filter(isEmail)));
}

/** 465 → implicit TLS; anything else → STARTTLS. */
export const defaultSecure = (port: number) => port === 465;

function fromEnv(env: NodeJS.ProcessEnv = process.env): SmtpSettings | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  const port = Number(env.SMTP_PORT) || 587;
  return {
    enabled: true, host: env.SMTP_HOST, port, secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : defaultSecure(port),
    user: env.SMTP_USER, pass: env.SMTP_PASS, fromName: env.SMTP_FROM_NAME || "CULTRAVEN",
    fromEmail: env.SMTP_FROM_EMAIL || env.SMTP_USER, adminEmails: parseEmailList(env.ORDER_ALERT_EMAILS || env.ADMIN_EMAIL),
  };
}

/** Settings saved by the admin (preferred) or the env fallback; null when email isn't configured. */
export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  try {
    await connectToDatabase();
    const doc = (await Setting.findOne({ key: "smtp" }).lean()) as any;
    const v = doc?.value;
    if (v?.host && v?.user) {
      const pass = decryptSecret(v.passEnc);
      if (pass) {
        return {
          enabled: v.enabled !== false, host: v.host, port: Number(v.port) || 587, secure: !!v.secure, user: v.user, pass,
          fromName: v.fromName || "CULTRAVEN", fromEmail: v.fromEmail || v.user, adminEmails: parseEmailList(v.adminEmails),
        };
      }
    }
  } catch (e) {
    console.error("[mailer] could not read SMTP settings:", e instanceof Error ? e.message : e);
  }
  return fromEnv();
}

export async function getPublicSmtpSettings(): Promise<PublicSmtpSettings | null> {
  const s = await getSmtpSettings();
  if (!s) return null;
  const { pass, ...rest } = s;
  return { ...rest, hasPassword: !!pass };
}

/** Save settings. An empty `pass` keeps the stored password. */
export async function saveSmtpSettings(input: Omit<SmtpSettings, "pass"> & { pass?: string }) {
  await connectToDatabase();
  const existing = (await Setting.findOne({ key: "smtp" }).lean()) as any;
  const passEnc = input.pass ? encryptSecret(input.pass) : existing?.value?.passEnc;
  if (!passEnc) throw new Error("A password is required the first time");
  await Setting.findOneAndUpdate(
    { key: "smtp" },
    { $set: { value: { enabled: input.enabled, host: input.host, port: input.port, secure: input.secure, user: input.user, passEnc, fromName: input.fromName, fromEmail: input.fromEmail, adminEmails: input.adminEmails } } },
    { upsert: true }
  );
}

export function buildTransport(s: SmtpSettings) {
  return nodemailer.createTransport({
    host: s.host, port: s.port, secure: s.secure, requireTLS: !s.secure,
    auth: { user: s.user, pass: s.pass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
  });
}

export interface MailInput { to: string; subject: string; html: string; text: string; kind: string; orderId?: string; replyTo?: string }

async function log(entry: { kind: string; to: string; subject: string; status: "sent" | "failed" | "skipped"; error?: string; orderId?: string }) {
  try { await EmailLog.create({ ...entry, error: (entry.error ?? "").slice(0, 300) }); } catch { /* logging must never break sending */ }
}

/** Send one email. Resolves to { ok } — never rejects. Retries once on failure. */
export async function sendMail(m: MailInput): Promise<{ ok: boolean; error?: string }> {
  const s = await getSmtpSettings();
  if (!s || !s.enabled) {
    await log({ kind: m.kind, to: m.to, subject: m.subject, status: "skipped", error: s ? "Email disabled" : "SMTP not configured", orderId: m.orderId });
    return { ok: false, error: "SMTP not configured" };
  }
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const transport = buildTransport(s);
      await transport.sendMail({ from: `"${s.fromName.replace(/"/g, "")}" <${s.fromEmail}>`, to: m.to, replyTo: m.replyTo, subject: m.subject, html: m.html, text: m.text });
      await log({ kind: m.kind, to: m.to, subject: m.subject, status: "sent", orderId: m.orderId });
      return { ok: true };
    } catch (e: any) {
      lastError = String(e?.code || e?.responseCode || e?.message || "send failed");
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  await log({ kind: m.kind, to: m.to, subject: m.subject, status: "failed", error: lastError, orderId: m.orderId });
  return { ok: false, error: lastError };
}

/** Plain-language reason for a failed SMTP test (never includes credentials). */
export function explainSmtpError(code: string): string {
  if (/EAUTH|535|534|Invalid login|auth/i.test(code)) return "The mail server rejected the username or password. For Gmail, use a 16-character App Password (2-Step Verification must be on).";
  if (/ENOTFOUND|EDNS/i.test(code)) return "The SMTP host could not be found — check the host name.";
  if (/ECONNREFUSED|ETIMEDOUT|ESOCKET|ECONNECTION|timeout/i.test(code)) return "Could not connect. Check the host and port (465 with SSL, or 587 with STARTTLS) and that your host allows outbound SMTP.";
  if (/ETLS|SSL|wrong version/i.test(code)) return "TLS mismatch — use port 465 with 'Use SSL' ON, or port 587 with it OFF.";
  return "The mail server returned an error. Re-check the settings and try again.";
}
