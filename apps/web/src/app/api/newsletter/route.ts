/**
 * POST /api/newsletter
 *
 * Subscribes an email address.
 * Validates email with Zod.
 * Rate-limited: 3 subscriptions per IP per 24 hours.
 * Checks for duplicate submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

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

// In-memory duplicate check (use Redis/DB in production)
const subscribedEmails = new Set<string>();

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many subscription attempts. Please try again tomorrow." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 422 }
    );
  }

  const { email } = parsed.data;

  // Check duplicate
  if (subscribedEmails.has(email)) {
    // Return 200 — don't reveal whether email is subscribed (privacy)
    return NextResponse.json({ message: "Subscribed" }, { status: 200 });
  }

  subscribedEmails.add(email);

  // TODO: In production, call notification-service or mailing provider (e.g. Mailchimp, Resend).
  // Example: await mailProvider.subscribe({ email, listId: process.env.NEWSLETTER_LIST_ID });
  console.info(`[newsletter] New subscription: ${email} from IP: ${ip}`);

  return NextResponse.json({ message: "Subscribed" }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
