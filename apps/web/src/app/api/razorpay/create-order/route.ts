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

import { NextRequest, NextResponse, after } from "next/server";
import { notifyOrderPlaced } from "@/lib/order-notify";
import { z } from "zod";
import { getRazorpayConfig } from "@/lib/razorpay";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { customerFromRequest } from "@/lib/customer-auth";
import { validateCoupon } from "@/lib/promotion-service";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from "@/lib/constants";

// ── Zod schema ────────────────────────────────────────────────────────────────
const BodySchema = z.object({
  items: z.array(z.object({
    slug: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(20),
    size: z.string().max(40).optional(),
    color: z.string().max(60).optional(),
  })).min(1, "Cart is empty").max(50),
  receipt: z.string().trim().max(40).optional(),
  name: z.string().trim().max(100),
  email: z.string().email().max(200),
  phone: z.string().regex(/^\d{10}$/, "Invalid phone"),
  address: z.object({
    line1: z.string().trim().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  }),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  couponCode: z.string().max(40).optional(),
  idempotencyKey: z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/).optional(),
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
  const cfg = getRazorpayConfig();
  if (!cfg) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret });
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

  const { receipt, name, email, phone, items, address, paymentMethod, couponCode, idempotencyKey } = result.data;
  // Never trust client-supplied identity or currency: the owner comes from the signed session, the currency is fixed.
  const userId = customerFromRequest(req)?.userId ?? "guest";
  const currency = "INR";

  // Online payment needs the Razorpay keys (placeholders in .env count as missing). COD never does.
  const razorpayConfig = getRazorpayConfig();
  if (paymentMethod !== "cod" && !razorpayConfig) {
    return NextResponse.json(
      { error: "Online payments are not available right now. Please choose Cash on Delivery.", code: "PAYMENTS_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  try {
    await connectToDatabase();

    // A repeated submit (double-click, retry, reload) returns the order already created for this attempt.
    if (idempotencyKey && userId !== "guest") {
      const prior = (await Order.findOne({ userId, idempotencyKey }).select("_id paymentMethod").lean()) as any;
      if (prior) return NextResponse.json({ orderId: String(prior._id), duplicate: true }, { status: 200 });
    }

    // 1. Load prices from catalogue
    const slugs = Array.from(new Set(items.map((i) => i.slug)));
    const dbProducts = await Product.find({ slug: { $in: slugs } });
    if (dbProducts.length !== slugs.length) {
      // Some products were deleted or are unknown
      return NextResponse.json({ error: "Some items in your cart are invalid or out of stock" }, { status: 400 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.slug, p]));

    // Sold-out pieces can't be bought, even from a stale cart or a crafted request.
    const soldOut = dbProducts.filter((p) => p.inStock === false).map((p) => p.title);
    if (soldOut.length) {
      return NextResponse.json({ error: `Sold out: ${soldOut.join(", ")}. Please remove it from your bag.`, code: "OUT_OF_STOCK" }, { status: 409 });
    }

    // 2. Compute subtotal from catalogue prices (never from the client); snapshot what the Order schema requires
    let subtotalPaise = 0;
    const finalItems = items.map((item) => {
      const p = productMap.get(item.slug)!;
      const price = p.pricePaise || 0;
      subtotalPaise += price * item.quantity;
      const size = item.size || "Free Size";
      return {
        productId: String(p._id),
        sku: `${p.slug}-${size}`.slice(0, 120),
        title: p.title,
        image: p.image || (p.images && p.images[0]) || "",
        size,
        color: item.color || "",
        quantity: item.quantity,
        pricePaise: price,
      };
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
      ...(idempotencyKey && userId !== "guest" ? { idempotencyKey } : {}),
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
      // Omit entirely for COD: a stored null would collide on the unique razorpayOrderId index.
      ...(razorpayOrderId ? { razorpayOrderId } : {}),
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      fulfillmentStatus: "processing",
    });

    if (paymentMethod === "cod") {
      // Emails go out after the response is sent; a mail failure can never fail or delay the order.
      after(() => notifyOrderPlaced(String(newOrder._id)));
      return NextResponse.json({ orderId: newOrder._id }, { status: 200 });
    }

    // Return ONLY safe data to client
    return NextResponse.json(
      {
        orderId: razorpayOrderId,
        dbOrderId: newOrder._id,
        amount: amountPaise,
        currency,
        keyId: razorpayConfig?.keyId ?? "",
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
