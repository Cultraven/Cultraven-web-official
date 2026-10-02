/**
 * POST /api/contact
 * Handles contact form submissions.
 * Validates all fields server-side (Rule 4 — never trust frontend only).
 * Rate-limited by IP (Rule 16): 3 / hour, plus 3 / minute so a burst is cut off sooner.
 * No secrets in response (Rule 5).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders, stripControlChars } from "@/lib/sanitize";

// ── Zod schema for server-side validation ─────────────────────────────────────
// Single-line fields lose control characters (CR/LF) so they can never forge log lines or mail headers later.
const oneLine = (max: number, min: number, tooShort: string, tooLong: string) =>
  z.string().max(max * 2, tooLong).transform((v) => stripControlChars(v)).pipe(z.string().min(min, tooShort).max(max, tooLong));

const ContactSchema = z.object({
  name: oneLine(100, 2, "Name too short", "Name too long"),
  email: z.string().trim().max(254).email("Invalid email").toLowerCase(),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine(
      (v) => !v || /^\d{10}$/.test(v.replace(/\s/g, "")),
      "Invalid phone number"
    ),
  subject: oneLine(100, 1, "Subject required", "Subject too long"),
  message: z.string().trim().min(20, "Message too short").max(2000, "Message too long"),
});

const RATE_LIMIT = 3; // max 3 submissions per IP per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get client IP for rate limiting
  const ip = clientIp(req);
  const burst = rateLimit(`contact-1m:${ip}`, 3, 60_000);
  const hourly = burst.ok ? rateLimit(`contact-1h:${ip}`, RATE_LIMIT, WINDOW_MS) : burst;
  if (!burst.ok || !hourly.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: retryHeaders(!burst.ok ? burst : hourly) }
    );
  }

  const body = await parseJsonBody(req, 8 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  // Validate
  const result = ContactSchema.safeParse(body.data);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, email, phone, subject, message } = result.data;

  // TODO: Replace this with your actual email/notification dispatch
  // e.g.: await sendEmail({ to: "support@cultraven.com", subject, name, email, phone, message })
  // For now, log to console (server-side only)
  console.log("[CONTACT FORM]", {
    name,
    email,
    phone: phone ?? "N/A",
    subject,
    messageLength: message.length,
    ip,
    timestamp: new Date().toISOString(),
  });

  // Success — do NOT return internal details
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
