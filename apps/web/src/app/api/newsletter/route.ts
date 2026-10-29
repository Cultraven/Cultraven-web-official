/**
 * POST /api/newsletter
 *
 * Subscribes an email address (saved in MongoDB, collection "newslettersubscribers").
 * Validates email with Zod.
 * Rate-limited: 3 subscriptions per IP per 24 hours (and 2 per minute).
 * Signing up twice is harmless and answers the same way (so nobody can check who is subscribed).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";

const BodySchema = z.object({
  email: z.string().trim().max(254, "Please enter a valid email address").email("Please enter a valid email address").toLowerCase(),
});

const RATE_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

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

  try {
    await connectToDatabase();
    // Insert if new; an address already on the list is left exactly as it was.
    await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email, source: "website" } }, { upsert: true });
    return NextResponse.json({ message: "Subscribed" }, { status: 200 });
  } catch (e) {
    console.error("[newsletter] could not save:", e instanceof Error ? e.message : e);
    return NextResponse.json({ message: "We could not save your email just now. Please try again in a moment." }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
