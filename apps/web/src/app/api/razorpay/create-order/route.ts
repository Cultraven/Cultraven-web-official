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
import { Product } from "@/lib/models/Product";
import { validateCoupon } from "@/lib/promotion-service";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from "@/lib/constants";

// ── Zod schema ────────────────────────────────────────────────────────────────
const BodySchema = z.object({
  userId: z.string().optional().default("guest"),
  items: z.array(z.object({
    slug: z.string(),
    quantity: z.number().int().min(1),
    size: z.string().optional(),
    color: z.string().optional(),
  })).min(1, "Cart is empty"),
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
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  couponCode: z.string().optional(),
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

  const { currency, receipt, name, email, phone, items, address, userId, paymentMethod, couponCode } = result.data;

  try {
    await connectToDatabase();

    // 1. Load prices from catalogue
    const slugs = items.map((i) => i.slug);
    const dbProducts = await Product.find({ slug: { $in: slugs } });
    if (dbProducts.length !== items.length) {
      // Could be some products were deleted or inactive, simplify for now
      return NextResponse.json({ error: "Some items in your cart are invalid or out of stock" }, { status: 400 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.slug, p.pricePaise]));

    // 2. Compute subtotal
    let subtotalPaise = 0;
    const finalItems = items.map((item) => {
      const price = productMap.get(item.slug) || 0;
      subtotalPaise += price * item.quantity;
      return { ...item, pricePaise: price };
    });

    // 3. Validate coupon and apply discount
    const promo = validateCoupon(couponCode, subtotalPaise);
    if (couponCode && !promo.isValid) {
      return NextResponse.json({ error: promo.error || "Invalid coupon" }, { status: 400 });
    }

    // 4. Compute shipping and COD fees
    const shippingPaise = subtotalPaise >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const codFeePaise = paymentMethod === "cod" ? COD_FEE : 0;

    const amountPaise = subtotalPaise - promo.discountPaise + shippingPaise + codFeePaise;

    if (amountPaise < 100) {
      return NextResponse.json({ error: "Minimum order amount is ₹1" }, { status: 400 });
    }

    // Maximum ₹5,000 for COD
    if (paymentMethod === "cod" && amountPaise > COD_MAX_LIMIT) {
      return NextResponse.json({ error: "COD is not available for orders above ₹5,000" }, { status: 400 });
    }

    let razorpayOrderId = null;

    if (paymentMethod === "razorpay") {
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
      razorpayOrderId = order.id;
    }

    // Create DB order
    const newOrder = await Order.create({
      userId,
      items: finalItems,
      subtotalPaise,
      shippingPaise,
      discountPaise: promo.discountPaise,
      couponCode: promo.isValid ? promo.code : null,
      codFeePaise,
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
      paymentMethod,
      razorpayOrderId,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      fulfillmentStatus: "processing",
    });

    if (paymentMethod === "cod") {
      return NextResponse.json({ orderId: newOrder._id }, { status: 200 });
    }

    // Return ONLY safe data to client
    return NextResponse.json(
      {
        orderId: razorpayOrderId,
        dbOrderId: newOrder._id,
        amount: amountPaise,
        currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      },
      { status: 200 }
    );
  } catch (err) {
    // Don't leak internal error details
    console.error("[Razorpay/Order] create-order error:", err);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
