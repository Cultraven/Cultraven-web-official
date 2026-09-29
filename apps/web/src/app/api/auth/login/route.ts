/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * Sets a secure HttpOnly session cookie on success.
 *
 * For a real production app, integrate with auth-service
 * (packages/auth) or NextAuth.js. This implementation uses
 * a JWT signed with NEXTAUTH_SECRET stored in a cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const BodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short").max(128),
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

/** Create a simple signed session token */
function createSessionToken(userId: string, email: string): string {
  const secret = process.env.SESSION_SECRET || "cultraven-fallback-secret";
  const payload = JSON.stringify({ userId, email, iat: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
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
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, password } = result.data;

  try {
    // ── Call the auth-service (or user-service) ──────────────────────────────
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL ?? "http://localhost:4001/api/v1";

    const authRes = await fetch(`${authServiceUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(5000),
    });

    if (!authRes.ok) {
      const errData = await authRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: (errData as { error?: string }).error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const data = (await authRes.json()) as { userId: string; email: string };
    const sessionToken = createSessionToken(data.userId, data.email);

    const response = NextResponse.json(
      { ok: true, email: data.email },
      { status: 200 }
    );

    response.cookies.set("cultraven_session", sessionToken, {
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
      { error: "Authentication service unavailable. Please try again." },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
