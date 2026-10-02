/**
 * POST /api/auth/forgot-password
 * Triggers a password reset email via the auth-service.
 * Always returns 200 for a well-formed request (prevents email enumeration); hostile / malformed bodies get 4xx.
 *
 * Rate limited per IP (3/hour) and per email (3/hour) so it can't be used to flood someone's inbox.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit } from "@/lib/sanitize";

const BodySchema = z.object({
  email: z.string().trim().max(254).email("Invalid email").toLowerCase(),
});

const HOUR = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  // Rate-limited requests still answer 200: the response must not depend on anything an attacker can probe.
  const ipOk = rateLimit(`forgot-ip:${ip}`, 3, HOUR).ok;

  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const result = BodySchema.safeParse(body.data);
  if (!result.success) return NextResponse.json({ ok: true }, { status: 200 });

  const { email } = result.data;
  const emailOk = rateLimit(`forgot-email:${email}`, 3, HOUR).ok;
  if (!ipOk || !emailOk) return NextResponse.json({ ok: true }, { status: 200 });

  // Fire-and-forget — don't await (prevents timing differences)
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
      console.error("[forgot-password] service error:", err instanceof Error ? err.message : err);
    }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
