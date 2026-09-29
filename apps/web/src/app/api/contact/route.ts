/**
 * POST /api/contact
 * Handles contact form submissions.
 * Validates all fields server-side (Rule 4 — never trust frontend only).
 * Rate-limited by IP (Rule 16).
 * No secrets in response (Rule 5).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ── Zod schema for server-side validation ─────────────────────────────────────
const ContactSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").toLowerCase(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^\d{10}$/.test(v.replace(/\s/g, "")),
      "Invalid phone number"
    ),
  subject: z.string().trim().min(1, "Subject required").max(100, "Subject too long"),
  message: z.string().trim().min(20, "Message too short").max(2000, "Message too long"),
});

// Simple in-memory rate limiting (production: use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // max 3 submissions per IP per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
  // Get client IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate
  const result = ContactSchema.safeParse(body);
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
