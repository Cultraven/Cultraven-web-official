/**
 * POST /api/account/password — change password ({ currentPassword, newPassword }).
 * The current password is required; the new one must satisfy the same strength rule as registration.
 * Rate limited per customer (password guessing with a stolen session).
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { activeCustomerFromRequest } from "@/lib/customer-auth";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_S, createCustomerSessionToken, sessionCookieOptions } from "@/lib/session-token";
import { afterResponse, sendPasswordChangedEmail } from "@/lib/password-reset";
import { ChangePasswordSchema } from "@/lib/profile-schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { json, unauthorized } from "@/lib/account-api";
import { isSameOrigin, parseJsonBody, rateLimitPeek, recordHit, resetRateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // email is sent after the response: leave room for a slow mail server

const FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return json({ error: body.error }, body.status);

  const parsed = ChangePasswordSchema.safeParse(body.data);
  if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, 422);
  const { currentPassword, newPassword } = parsed.data;

  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();
    const failKey = `acct-pw-fail:${me.userId}`;
    const locked = rateLimitPeek(failKey, MAX_FAILS, FAIL_WINDOW_MS);
    if (!locked.ok) return json({ error: "Too many attempts. Try again in a few minutes." }, 429, retryHeaders(locked));

    await connectToDatabase();
    const user = (await User.findOne({ _id: me.userId, deletedAt: null }).select("+passwordHash").lean()) as any;
    if (!user) return unauthorized();

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      recordHit(failKey, FAIL_WINDOW_MS); // only wrong guesses count
      return json({ error: "Your current password is incorrect.", issues: { currentPassword: ["Your current password is incorrect."] } }, 422);
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updateOne({ _id: me.userId, deletedAt: null }, { $set: { passwordHash, passwordChangedAt: new Date() } });
    resetRateLimit(failKey);
    afterResponse(() => sendPasswordChangedEmail(me.userId));
    // Every older sign-in (other phones, other browsers) stops working; this device gets a fresh one so the person stays signed in.
    const res = json({ ok: true });
    res.cookies.set(CUSTOMER_SESSION_COOKIE, createCustomerSessionToken(me.userId, me.email, me.role || "customer"), sessionCookieOptions(CUSTOMER_SESSION_MAX_AGE_S));
    return res;
  } catch (e) {
    console.error("[account/password]", e instanceof Error ? e.message : e);
    return json({ error: "Could not change your password. Please try again." }, 500);
  }
}
