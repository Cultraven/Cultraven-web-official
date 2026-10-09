/**
 * POST /api/auth/register
 *
 * Self-contained registration: creates the user in MongoDB with a bcrypt-hashed password (cost 12) and
 * issues a session cookie.
 *
 * Security:
 * - Body parsed safely (size cap, JSON only, no $-operator / prototype keys) before zod
 * - Zod validation (email, names, mandatory mobile number, password strength) with max lengths; only whitelisted fields reach the model
 *   and the role is always "customer" (no mass assignment)
 * - Rate limited: 3/min and 5/15min per IP
 * - HttpOnly + SameSite=Lax (+ Secure in production) cookie, no fallback signing secret
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_S, createCustomerSessionToken, sessionCookieOptions } from "@/lib/session-token";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders, stripControlChars, stripTags } from "@/lib/sanitize";
import { MobileField } from "@/lib/address-schema";

const cleanName = (max: number, label: string) =>
  z.string().max(max * 2).transform((v) => stripTags(stripControlChars(v)).trim()).pipe(z.string().min(1, `${label} required`).max(max));

const RegisterSchema = z.object({
  firstName: cleanName(50, "First name"),
  lastName: cleanName(50, "Last name"),
  email: z.string().trim().max(254).email("Invalid email").toLowerCase(),
  // Mandatory. Same rules as the delivery-address form: 10 digits starting 6-9, "+91 / 0 / spaces / dashes" accepted and stripped.
  phone: MobileField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase and a number")
    // bcrypt only uses the first 72 bytes: refuse longer ones instead of silently truncating them
    .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 characters"),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const burst = rateLimit(`register-ip-1m:${ip}`, 3, 60_000);
  const sustained = burst.ok ? rateLimit(`register-ip-15m:${ip}`, 5, 15 * 60_000) : burst;
  if (!burst.ok || !sustained.ok) {
    return NextResponse.json({ error: "Too many registrations. Try again later." }, { status: 429, headers: retryHeaders(!burst.ok ? burst : sustained) });
  }

  const body = await parseJsonBody(req, 4 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const result = RegisterSchema.safeParse(body.data);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", issues: result.error.flatten().fieldErrors }, { status: 422 });
  }

  const { firstName, lastName, email, phone, password } = result.data;

  try {
    await connectToDatabase();

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      // Explicit fields only: nothing from the request body is spread into the model.
      user = await User.create({ firstName, lastName, email, phone, passwordHash, role: "customer", emailVerified: false });
    } catch (e: any) {
      // Two simultaneous sign-ups for the same email: the unique index decides
      if (e?.code === 11000) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      throw e;
    }

    const token = createCustomerSessionToken(user._id.toString(), user.email, user.role);
    const response = NextResponse.json({ ok: true, email: user.email, firstName: user.firstName }, { status: 201 });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, sessionCookieOptions(CUSTOMER_SESSION_MAX_AGE_S));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("[auth/register] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
