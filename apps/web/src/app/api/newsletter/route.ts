/**
 * POST /api/newsletter
 *
 * Subscribes an email address.
 * Validates email with Zod.
 * Rate-limited: 3 subscriptions per IP per 24 hours (and 2 per minute).
 * Checks for duplicate submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";

const BodySchema = z.object({
  email: z.string().trim().max(254, "Please enter a valid email address").email("Please enter a valid email address").toLowerCase(),
});

const RATE_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory duplicate check (use Redis/DB in production). Bounded so a flood of fake addresses can't exhaust memory.
const MAX_REMEMBERED = 10_000;
const subscribedEmails = new Set<string>();

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const ip = clientIp(request);
  const burst = rateLimit(`newsletter-1m:${ip}`, 2, 60_000);
  const daily = burst.ok ? rateLimit(`newsletter-24h:${ip}`, RATE_LIMIT, WINDOW_MS) : burst;
  if (!burst.ok || !daily.ok) {
    return NextResponse.json(
      { message: "Too many subscription attempts. Please try again tomorrow." },
      { status: 429, headers: retryHeaders(!burst.ok ? burst : daily) }
    );
  }

  const body = await parseJsonBody(request, 2 * 1024);
  if (!body.ok) return NextResponse.json({ message: body.error }, { status: body.status });

  const parsed = BodySchema.safeParse(body.data);
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

  if (subscribedEmails.size >= MAX_REMEMBERED) {
    // Drop the oldest entry (Set keeps insertion order)
    const oldest = subscribedEmails.values().next().value;
    if (oldest !== undefined) subscribedEmails.delete(oldest);
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
