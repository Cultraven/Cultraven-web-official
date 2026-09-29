/**
 * POST /api/auth/register
 *
 * Self-contained registration — creates user in MongoDB with bcrypt-hashed password.
 * Issues a session token cookie on success.
 *
 * Security:
 * - Zod validation (email, password strength)
 * - bcryptjs password hashing (cost factor 12)
 * - Rate limited: 3 registrations / 15 min per IP
 * - HttpOnly + Secure + SameSite=Lax cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

// ─── Register Schema ─────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  firstName: z.string().trim().min(1, "First name required").max(50),
  lastName: z.string().trim().min(1, "Last name required").max(50),
  email: z.string().trim().email("Invalid email").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and a number"
    ),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string, max = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

function createSessionToken(userId: string, email: string, role: string): string {
  const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
  const payload = JSON.stringify({ userId, email, role, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip, 3)) {
    return NextResponse.json(
      { error: "Too many registrations. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { firstName, lastName, email, password } = result.data;

  try {
    await connectToDatabase();

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password with cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: "customer",
      emailVerified: false,
    });

    const sessionToken = createSessionToken(user._id.toString(), user.email, user.role);

    const response = NextResponse.json(
      { ok: true, email: user.email, firstName: user.firstName },
      { status: 201 }
    );

    response.cookies.set("cultraven_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/register] error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
