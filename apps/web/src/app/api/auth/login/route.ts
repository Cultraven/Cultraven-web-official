/**
 * POST /api/auth/login
 *
 * Self-contained auth: reads directly from MongoDB, verifies the password with bcrypt and issues an
 * HMAC-signed session in an HttpOnly cookie.
 *
 * Security:
 * - Body is parsed safely (size cap, JSON only, no $-operator / prototype keys) BEFORE zod
 * - Zod validation with max lengths; email/password are always plain strings in the query
 * - One generic error for "no such account" and "wrong password" (no account enumeration), and bcrypt always
 *   runs (against a real dummy hash when the user doesn't exist) so response time doesn't reveal it either
 * - Rate limited: 10/min and 50/15min per IP, and 5 FAILED attempts per email per 15 min
 * - No fallback signing secret; HttpOnly + SameSite=Lax (+ Secure in production) cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isUserActive } from "@/lib/account-delete";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_S, createCustomerSessionToken, sessionCookieOptions } from "@/lib/session-token";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, rateLimitPeek, recordHit, resetRateLimit, retryHeaders } from "@/lib/sanitize";

const BodySchema = z.object({
  email: z.string().trim().max(254).email().toLowerCase(),
  password: z.string().min(1).max(128),
});

const GENERIC_FAIL = "Invalid email or password.";
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_EMAIL = 5;

// A genuine bcrypt hash at the same cost as real accounts (12): comparing against it takes as long as a real check.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("cultraven-timing-pad-not-a-real-password", 12));

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const burst = rateLimit(`login-ip-1m:${ip}`, 10, 60_000);
  const sustained = burst.ok ? rateLimit(`login-ip-15m:${ip}`, 50, FAIL_WINDOW_MS) : burst;
  if (!burst.ok || !sustained.ok) {
    const r = !burst.ok ? burst : sustained;
    return NextResponse.json({ error: "Too many login attempts. Please try again shortly." }, { status: 429, headers: retryHeaders(r) });
  }

  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const result = BodySchema.safeParse(body.data);
  if (!result.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 422 });
  const { email, password } = result.data;

  // Lock an email after repeated failures (applies to any string, so it reveals nothing about which accounts exist).
  const failKey = `login-fail:${email}`;
  const locked = rateLimitPeek(failKey, MAX_FAILS_PER_EMAIL, FAIL_WINDOW_MS);
  if (!locked.ok) {
    return NextResponse.json({ error: "Too many failed attempts. Please try again later or reset your password." }, { status: 429, headers: retryHeaders(locked) });
  }

  try {
    await connectToDatabase();

    // passwordHash is select:false by default
    const user = await User.findOne({ email }).select("+passwordHash");

    // A soft-deleted account (deletedAt / status "deleted") is treated exactly like an unknown email.
    const active = !!user && isUserActive(user);

    // Always run bcrypt: same work whether or not the account exists
    const hashToCompare = (active && user?.passwordHash) || (await getDummyHash());
    let isValid = false;
    try { isValid = await bcrypt.compare(password, hashToCompare); } catch { isValid = false; }

    if (!user || !active || !isValid) {
      recordHit(failKey, FAIL_WINDOW_MS);
      return NextResponse.json({ error: GENERIC_FAIL }, { status: 401 });
    }

    resetRateLimit(failKey);
    const token = createCustomerSessionToken(user._id.toString(), user.email, user.role || "customer");

    const response = NextResponse.json({ ok: true, email: user.email, firstName: user.firstName }, { status: 200 });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, sessionCookieOptions(CUSTOMER_SESSION_MAX_AGE_S));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("[auth/login] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "An error occurred. Please try again later." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
