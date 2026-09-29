/**
 * POST /api/auth/register
 * POST /api/auth/logout
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// ─── Register ─────────────────────────────────────────────────────────────────

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
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL ?? "http://localhost:4001/api/v1";

    const authRes = await fetch(`${authServiceUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
      signal: AbortSignal.timeout(5000),
    });

    if (!authRes.ok) {
      const errData = await authRes.json().catch(() => ({}));
      const msg = (errData as { error?: string }).error;
      // Common case: email already registered
      if (authRes.status === 409 || msg?.toLowerCase().includes("exist")) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: msg || "Registration failed. Please try again." },
        { status: authRes.status }
      );
    }

    const data = (await authRes.json()) as { userId: string; email: string };
    const sessionToken = createSessionToken(data.userId, data.email);

    const response = NextResponse.json(
      { ok: true, email: data.email },
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
      { error: "Registration service unavailable. Please try again." },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
