/**
 * POST /api/auth/forgot-password
 * Emails a password-reset link (single-use, expires in 30 minutes) to the account with that address.
 * Always returns 200 for a well-formed request, whether or not an account exists (prevents email enumeration); hostile / malformed
 * bodies get 4xx. The email is prepared after the response is sent, so the answer is just as fast for unknown addresses.
 *
 * Rate limited per IP (3/hour) and per email (3/hour) so it can't be used to flood someone's inbox.
 * Only customer and delivery-partner accounts can use it — see canResetByEmail in lib/password-reset.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit } from "@/lib/sanitize";
import { afterResponse, sendResetEmailFor } from "@/lib/password-reset";

export const maxDuration = 30; // email is sent after the response: leave room for a slow mail server

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

  afterResponse(() => sendResetEmailFor(email, ip));

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
