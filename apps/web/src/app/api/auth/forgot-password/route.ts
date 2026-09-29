/**
 * POST /api/auth/forgot-password
 * Triggers a password reset email via the auth-service.
 * Always returns 200 (prevents email enumeration).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().email("Invalid email"),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    // Still return 200 to prevent enumeration
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: true }, { status: 200 }); }

  const result = BodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { email } = result.data;

  // Fire-and-forget — don't await (prevents timing attacks)
  Promise.resolve().then(async () => {
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4001/api/v1";
      await fetch(`${authServiceUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      console.error("[forgot-password] service error:", err);
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
