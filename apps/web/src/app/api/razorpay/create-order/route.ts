/**
 * POST /api/razorpay/create-order
 *
 * Creates a Razorpay order server-side.
 * Called from the checkout page when user clicks "Place Order".
 *
 * Security rules followed:
 * - Rule 5: No secrets in client bundle — key_secret lives only here
 * - Rule 4: Zod validates all input
 * - Rule 16: Rate limited per IP
 * - Rule 19: Strict headers via next.config
 *
 * Returns: { orderId, amount, currency, keyId } — keyId is PUBLIC safe to send to client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";

// ── Zod schema ────────────────────────────────────────────────────────────────
const BodySchema = z.object({
  userId: z.string().optional().default("guest"),
  items: z.array(z.any()), // Assuming cart items match OrderItem shape for now
  subtotalPaise: z.number().int().min(0),
  shippingPaise: z.number().int().min(0),
  amountPaise: z.number().int().min(100, "Minimum order amount is ₹1"),
  currency: z.string().default("INR"),
  receipt: z.string().trim().max(40).optional(),
  name: z.string().trim().max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, "Invalid phone"),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  }),
});

// ── Rate limiting (production: use Upstash Redis) ─────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 10 order attempts per IP per hour
const WINDOW_MS = 60 * 60 * 1000;

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

// ── Razorpay client (server-only) ─────────────────────────────────────────────
function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured");
  }

  return new Razorpay({ key_id, key_secret });
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate
  const result = BodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { amountPaise, currency, receipt, name, email, phone, items, subtotalPaise, shippingPaise, address, userId } = result.data;

  try {
    await connectToDatabase();
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
      notes: {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
    });

    // Create DB order linked to Razorpay order ID
    await Order.create({
      userId,
      items,
      subtotalPaise,
      shippingPaise,
      totalPaise: amountPaise,
      deliveryAddress: {
        name,
        email,
        phone,
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      razorpayOrderId: order.id,
      paymentStatus: "pending",
      fulfillmentStatus: "processing",
    });

    // Return ONLY safe data to client
    // Never send key_secret to the frontend
    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      },
      { status: 200 }
    );
  } catch (err) {
    // Don't leak internal error details
    console.error("[Razorpay] create-order error:", err);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
