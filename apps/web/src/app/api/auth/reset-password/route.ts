/**
 * POST /api/auth/reset-password   { token, password }
 * Chooses a new password with the link from the "Forgot password" (or new-account "set your password") email.
 *
 * Security:
 * - Same-origin only, tiny JSON body, no $-operators; the token must have the exact shape we issue before any database lookup
 * - The new password must meet the same policy as sign-up (checked BEFORE the link is used up, so a typo doesn't burn it)
 * - The link is claimed atomically: it works once, and only until it expires
 * - Rate limited per IP; every failure says the same thing ("expired or already used")
 * - On success: password re-hashed (bcrypt cost 12), every older sign-in stops working (passwordChangedAt), the sign-in lock is cleared,
 *   other pending links are cancelled, and the person gets a "password changed" email. Nobody is signed in automatically.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { PasswordReset } from "@/lib/models/PasswordReset";
import { isUserActive } from "@/lib/account-delete";
import { hashPassword, PasswordPolicy } from "@/lib/password";
import { afterResponse, consumeToken, inspectToken, loginPathFor, releaseToken, sendPasswordChangedEmail, TOKEN_SHAPE } from "@/lib/password-reset";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, resetRateLimit, retryHeaders } from "@/lib/sanitize";

const BodySchema = z.object({ token: z.string().regex(TOKEN_SHAPE), password: PasswordPolicy });

const DEAD_LINK = "This link has expired or was already used. Please request a new one.";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const limit = rateLimit(`reset-ip:${ip}`, 10, 15 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429, headers: retryHeaders(limit) });

  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const parsed = BodySchema.safeParse(body.data);
  if (!parsed.success) {
    // A bad token looks like any dead link; a weak password gets the rule that failed.
    const tokenBad = parsed.error.issues.some((i) => i.path[0] === "token");
    return NextResponse.json({ error: tokenBad ? DEAD_LINK : (parsed.error.issues[0]?.message ?? "Choose a stronger password.") }, { status: tokenBad ? 400 : 422 });
  }
  const { token, password } = parsed.data;

  try {
    // Look first (no side effects) so an obviously dead link never costs a bcrypt hash.
    if (!(await inspectToken(token))) return NextResponse.json({ error: DEAD_LINK }, { status: 400 });

    const claim = await consumeToken(token);
    if (!claim) return NextResponse.json({ error: DEAD_LINK }, { status: 400 });

    await connectToDatabase();
    const user = (await User.findById(claim.userId).select("email role status deletedAt").lean()) as any;
    if (!user || !isUserActive(user)) return NextResponse.json({ error: DEAD_LINK }, { status: 400 });

    try {
      const passwordHash = await hashPassword(password);
      await User.updateOne({ _id: user._id, deletedAt: null }, { $set: { passwordHash, passwordChangedAt: new Date(), emailVerified: true } });
    } catch (e) {
      await releaseToken(claim.id).catch(() => {}); // let them try again with the same link
      throw e;
    }

    await PasswordReset.deleteMany({ userId: user._id, usedAt: null }); // any other pending links are now pointless
    resetRateLimit(`login-fail:${String(user.email).toLowerCase()}`); // an account locked by failed attempts can sign in again
    afterResponse(() => sendPasswordChangedEmail(String(user._id)));

    const res = NextResponse.json({ ok: true, loginPath: loginPathFor(user.role) }, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[auth/reset-password] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
