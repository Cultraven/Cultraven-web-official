/**
 * POST /api/auth/admin-login
 *
 * Verifies the admin password server-side, then sets
 * a secure HttpOnly cookie so middleware can protect /admin routes.
 *
 * Environment variables required:
 *   ADMIN_PASSWORD       — the admin's plain-text password (set in Vercel env)
 *   ADMIN_SECRET_TOKEN   — random token stored in cookie & verified by middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  password: z.string().min(1, "Password required").max(128),
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max 5 attempts per IP per 15 minutes
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = BodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const { password } = result.data;

  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminToken = process.env.ADMIN_SECRET_TOKEN;

  if (!adminPassword || !adminToken) {
    console.error("[admin-login] ADMIN_PASSWORD or ADMIN_SECRET_TOKEN not set");
    return NextResponse.json(
      { error: "Admin authentication not configured." },
      { status: 500 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(adminPassword);
  
  let passwordMatch = false;
  if (passwordBuffer.length === expectedBuffer.length) {
    try {
      const crypto = await import("crypto");
      passwordMatch = crypto.timingSafeEqual(passwordBuffer, expectedBuffer);
    } catch {
      passwordMatch = false;
    }
  }

  if (!passwordMatch) {
    // Log failed attempt (server-side only)
    console.warn(`[admin-login] Failed attempt from IP: ${ip}`);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Set secure admin cookie
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("cultraven_admin", adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return response;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
