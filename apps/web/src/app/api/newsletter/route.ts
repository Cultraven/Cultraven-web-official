/**
 * POST /api/newsletter
 *
 * "Notify me" boxes and the footer form: subscribes an email address (saved in MongoDB, collection "newslettersubscribers") with what
 * they asked to hear about and the page they were on. A NEW address gets a thank-you email and your team gets an alert; both are sent after
 * the response, and email trouble never fails the sign-up. Signing up twice is harmless and answers the same way (so nobody can check who is
 * subscribed), and sends nothing again. Someone the team marked "unsubscribed" who signs up again is subscribed again.
 * Validates with Zod. Rate-limited: 3 sign-ups per IP per 24 hours (and 2 per minute).
 */

import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { interestField, pageField } from "@/lib/subscribers";
import { notifyNewSubscriber } from "@/lib/subscriber-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // the emails go out after the response: leave room for a slow mail server

const BodySchema = z.object({
  email: z.string().trim().max(254, "Please enter a valid email address").email("Please enter a valid email address").toLowerCase(),
  interest: interestField,
  page: pageField,
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

  const { email, interest = "", page = "" } = parsed.data;

  try {
    await connectToDatabase();
    // Insert if new; an address already on the list is left exactly as it was.
    const res = await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email, source: "website", interest, page, status: "subscribed" } }, { upsert: true });
    let isNew = Boolean(res?.upsertedCount);
    if (!isNew) {
      // Marked "unsubscribed" earlier and asking again: subscribe them again.
      const back = await NewsletterSubscriber.updateOne({ email, status: "unsubscribed" }, { $set: { status: "subscribed", interest, page } });
      isNew = Boolean(back?.modifiedCount);
    }
    if (isNew) after(() => notifyNewSubscriber({ email, interest, page }));
    return NextResponse.json({ message: "Subscribed" }, { status: 200 });
  } catch (e) {
    console.error("[newsletter] could not save:", e instanceof Error ? e.message : e);
    return NextResponse.json({ message: "We could not save your email just now. Please try again in a moment." }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
