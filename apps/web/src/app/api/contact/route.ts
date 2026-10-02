/**
 * POST /api/contact
 * Contact us form. Validates every field server-side, rate-limits by IP, saves the message to MongoDB (so it is never lost),
 * emails the support team and sends the customer an acknowledgement with a reference number. Email problems never fail the request.
 */

import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { SupportMessage, supportRef } from "@/lib/models/SupportMessage";
import { customerFromRequest } from "@/lib/customer-auth";
import { notifySupportMessage } from "@/lib/support-notify";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders, stripControlChars } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// Single-line fields lose control characters (CR/LF) so they can never forge log lines or mail headers.
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
    .refine((v) => !v || /^\d{10}$/.test(v.replace(/\s/g, "")), "Invalid phone number"),
  subject: oneLine(100, 1, "Subject required", "Subject too long"),
  message: z.string().trim().min(20, "Message too short").max(2000, "Message too long"),
  /** Optional order number (CR-XXXXXX) the message is about. */
  orderRef: z.string().trim().toUpperCase().regex(/^(CR-[0-9A-F]{6})?$/, "Invalid order number").optional(),
  /** Honeypot: real people never fill this hidden field. */
  website: z.string().max(200).optional(),
});

const RATE_LIMIT = 5; // submissions per IP per hour
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = clientIp(req);
  const burst = rateLimit(`contact-1m:${ip}`, 3, 60_000);
  const hourly = burst.ok ? rateLimit(`contact-1h:${ip}`, RATE_LIMIT, WINDOW_MS) : burst;
  if (!burst.ok || !hourly.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: retryHeaders(!burst.ok ? burst : hourly) });
  }

  const body = await parseJsonBody(req, 8 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });

  const result = ContactSchema.safeParse(body.data);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", issues: result.error.flatten().fieldErrors }, { status: 422 });
  }
  const { name, email, phone, subject, message, orderRef, website } = result.data;

  // Bots that fill the hidden field get a fake success and nothing is stored.
  if (website) return NextResponse.json({ ok: true, ref: "HLP-000000" }, { status: 200 });

  try {
    await connectToDatabase();
    const me = customerFromRequest(req);
    const doc = await SupportMessage.create({ name, email, phone: (phone ?? "").replace(/\s/g, ""), subject, message, orderRef: orderRef ?? "", userId: me?.userId ?? "" });
    const ref = supportRef(String(doc._id));
    after(() => notifySupportMessage(String(doc._id)));
    return NextResponse.json({ ok: true, ref }, { status: 200 });
  } catch (e) {
    console.error("[contact] save failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We couldn't send your message right now. Please try WhatsApp or email instead." }, { status: 503 });
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
