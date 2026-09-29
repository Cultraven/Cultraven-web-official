/**
 * POST /api/auth/login
 *
 * Self-contained auth — reads directly from MongoDB.
 * Validates email + password (bcryptjs), issues a proper HMAC-signed JWT,
 * sets a secure HttpOnly cookie. No external microservice dependency.
 *
 * Security:
 * - Zod validation
 * - Constant-time bcrypt comparison (prevents timing attacks)
 * - HMAC-SHA256 signed token (HS256 style)
 * - Rate limited: 10 attempts / 15 min per IP
 * - HttpOnly + Secure + SameSite=Lax cookie
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

// ── Zod schema ────────────────────────────────────────────────────────────────
const BodySchema = z.object({
  email: z.string().trim().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password required").max(128),
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ── Session token (HMAC-SHA256, base64url encoded) ────────────────────────────
function createSessionToken(userId: string, email: string, role: string): string {
  const secret = process.env.SESSION_SECRET || "cultraven-dev-secret-change-in-prod";
  const payload = JSON.stringify({ userId, email, role, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = BodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = result.data;

  try {
    await connectToDatabase();

    // Retrieve user including passwordHash (select: false by default)
    const user = await User.findOne({ email }).select("+passwordHash");

    // Always run bcrypt — prevents timing attacks even when user not found
    const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 401 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    const token = createSessionToken(
      user._id.toString(),
      user.email,
      user.role || "customer"
    );

    const response = NextResponse.json(
      { ok: true, email: user.email, firstName: user.firstName },
      { status: 200 }
    );

    response.cookies.set("cultraven_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
