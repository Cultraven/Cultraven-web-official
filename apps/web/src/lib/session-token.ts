/**
 * Issues the signed customer session (cookie `cultraven_session`). Verification lives in lib/customer-auth.ts and
 * middleware.ts. Format: base64url(JSON{userId,email,role,iat,exp}) + "." + base64url(HMAC-SHA256(SESSION_SECRET)).
 *
 * There is deliberately NO fallback secret: without SESSION_SECRET nothing can be signed (a hard-coded default
 * would let anyone forge a session or an admin token).
 */
import crypto from "crypto";

export const CUSTOMER_SESSION_COOKIE = "cultraven_session";
export const CUSTOMER_SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

export function createCustomerSessionToken(userId: string, email: string, role: string, now = Date.now()): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const payload = JSON.stringify({ userId, email, role, iat: now, exp: now + CUSTOMER_SESSION_MAX_AGE_S * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

/** HttpOnly (no JS access), SameSite=Lax (not sent on cross-site POSTs), Secure in production. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: maxAgeSeconds, path: "/" };
}
