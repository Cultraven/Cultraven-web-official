/**
 * "Forgot password" and "set your password" links — the secure way to let someone choose a new password by email.
 *
 *  - The link carries a random 256-bit token. Only its SHA-256 hash is stored (lib/models/PasswordReset.ts).
 *  - A token works ONCE (claimed atomically, so two clicks can't both succeed) and expires: 30 minutes for "forgot
 *    password", 48 hours for a new account's "set your password" link.
 *  - Asking for a new link cancels the older ones.
 *  - We never email a password. The mail only ever contains the link.
 */
import crypto from "crypto";
import { after } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PasswordReset } from "@/lib/models/PasswordReset";
import { isUserActive } from "@/lib/account-delete";
import { sendMail } from "@/lib/mailer";
import { passwordResetEmail, passwordChangedEmail } from "@/lib/email-templates";
import { BUSINESS } from "@/lib/business";
import { siteUrl } from "@/lib/site-url";

export const RESET_TTL_MINUTES = 30;
export const INVITE_TTL_HOURS = 48;
export type TokenPurpose = "reset" | "invite";

/** A token is 32 random bytes in base64url = exactly 43 characters. Anything else is rejected before touching the database. */
export const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
export const newToken = () => crypto.randomBytes(32).toString("base64url");

export const resetLink = (token: string) => `${siteUrl()}/reset-password?token=${token}`;

/** Where a person signs in after choosing a password. */
export const loginPathFor = (role?: string) => (role === "delivery" ? "/portal-delivery-access" : role === "admin" || role === "superadmin" ? "/portal-access" : "/login");

/**
 * Who may ask for a reset link on the public "Forgot password" page: customers and delivery partners.
 * Admin and super-admin accounts are changed from the admin panel (or get a "set your password" link when created), so a stolen
 * mailbox alone can never take over the admin panel.
 */
export const canResetByEmail = (role?: string) => role === "customer" || role === "delivery";

/**
 * Create a fresh token for a user. Returns the raw token — it is never stored.
 *
 * Each person has one row per purpose ("slot") that is rewritten in a single atomic step, so the older link of the same kind stops
 * working at that moment — even if two requests for the same person arrive at the same instant (the last write wins; the other
 * email's link is simply dead). A staff invite and a forgot-password link are different purposes and can both be pending.
 */
export async function issueToken(userId: string, purpose: TokenPurpose, ip = ""): Promise<{ token: string; expiresAt: Date }> {
  await connectToDatabase();
  const token = newToken();
  const ttl = purpose === "invite" ? INVITE_TTL_HOURS * 3_600_000 : RESET_TTL_MINUTES * 60_000;
  const expiresAt = new Date(Date.now() + ttl);
  await PasswordReset.findOneAndUpdate(
    { slot: `${userId}:${purpose}` },
    { $set: { userId, purpose, tokenHash: hashToken(token), expiresAt, usedAt: null, requestIp: ip.slice(0, 64) } },
    { upsert: true },
  );
  return { token, expiresAt };
}

export interface TokenInfo { userId: string; purpose: TokenPurpose }

/** Is this link still good? (Does not use it up.) */
export async function inspectToken(token: string): Promise<TokenInfo | null> {
  if (!TOKEN_SHAPE.test(token)) return null;
  await connectToDatabase();
  const row = (await PasswordReset.findOne({ tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } }).lean()) as any;
  return row ? { userId: String(row.userId), purpose: row.purpose } : null;
}

/** Use the link up — atomically, so only one request can ever win. Null if it was already used, expired or never existed. */
export async function consumeToken(token: string): Promise<(TokenInfo & { id: string }) | null> {
  if (!TOKEN_SHAPE.test(token)) return null;
  await connectToDatabase();
  const row = (await PasswordReset.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  ).lean()) as any;
  return row ? { id: String(row._id), userId: String(row.userId), purpose: row.purpose } : null;
}

/** Hand a token back (saving the new password failed after the link was claimed) so the person can try again. */
export const releaseToken = (id: string) => PasswordReset.updateOne({ _id: id }, { $set: { usedAt: null } });

/** Email a reset link to the account with this address, if there is one. Never tells the caller whether there was. */
export async function sendResetEmailFor(email: string, ip: string): Promise<void> {
  try {
    await connectToDatabase();
    const user = (await User.findOne({ email }).select("firstName email role status deletedAt").lean()) as any;
    if (!user || !isUserActive(user) || !canResetByEmail(user.role)) return;
    const { token } = await issueToken(String(user._id), "reset", ip);
    const mail = passwordResetEmail({ firstName: user.firstName || "there", email: user.email, resetUrl: resetLink(token), expiresMinutes: RESET_TTL_MINUTES, requestedAt: new Date(), siteUrl: siteUrl() });
    await sendMail({ to: user.email, ...mail, kind: "password-reset", replyTo: BUSINESS.supportEmail });
  } catch (e) {
    console.error("[password-reset] could not send the reset email:", e instanceof Error ? e.message : e);
  }
}

/** "Your password was changed" security notice. Never throws. */
export async function sendPasswordChangedEmail(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    const user = (await User.findById(userId).select("firstName email role status deletedAt").lean()) as any;
    if (!user || !isUserActive(user)) return;
    const mail = passwordChangedEmail({ firstName: user.firstName || "there", changedAt: new Date(), signInUrl: `${siteUrl()}${loginPathFor(user.role)}`, resetUrl: `${siteUrl()}/forgot-password`, siteUrl: siteUrl() });
    await sendMail({ to: user.email, ...mail, kind: "password-changed", replyTo: BUSINESS.supportEmail });
  } catch (e) {
    console.error("[password-reset] could not send the password-changed email:", e instanceof Error ? e.message : e);
  }
}

/** Run after the response is sent (works on serverless hosts too). Falls back to fire-and-forget outside a request, e.g. in scripts. */
export function afterResponse(task: () => Promise<unknown>) {
  try { after(task); } catch { void task().catch(() => {}); }
}
