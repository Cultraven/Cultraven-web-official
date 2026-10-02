/**
 * POST /api/razorpay/webhook
 *
 * Handles Razorpay webhook events (payment.captured, payment.failed, etc.)
 *
 * Security rules followed:
 * - Rule 5: webhook secret lives only on server
 * - Signature verified using Razorpay's HMAC-SHA256 before any processing
 * - Rule 4: Zod validates event payload structure
 * - Returns 200 quickly to prevent Razorpay retries; heavy work is async
 *
 * Environment variable required:
 *   RAZORPAY_WEBHOOK_SECRET — set in Razorpay Dashboard → Webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { notifyOrderPlaced } from "@/lib/order-notify";
import { getWebhookSecretAsync, verifyWebhookSignature } from "@/lib/razorpay";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";

// ── Webhook event shape (minimal — extend as needed) ──────────────────────────
interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity?: {
        id?: string;
        receipt?: string;
        amount?: number;
        status?: string;
      };
    };
  };
}

// ── Signature verification ────────────────────────────────────────────────────
// The secret is the admin-saved one (Admin -> Settings -> Payments) or RAZORPAY_WEBHOOK_SECRET. Fails closed when neither exists.
async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  const secret = await getWebhookSecretAsync();
  if (!secret) {
    console.error("[webhook] no webhook secret configured (Admin -> Settings -> Payments, or RAZORPAY_WEBHOOK_SECRET)");
    return false;
  }
  return verifyWebhookSignature(rawBody, signature, secret);
}

// Razorpay events are a few KB; anything bigger is not from Razorpay.
const MAX_WEBHOOK_BYTES = 256 * 1024;

/** Mongo queries below only ever receive plain strings, even though the payload is signed. */
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 && v.length <= 128 ? v : null);

// ── Event handlers ────────────────────────────────────────────────────────────
async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payload?.payment?.entity;
  if (!payment) return;
  const rzpOrderId = str(payment.order_id);
  if (!rzpOrderId) return;

  try {
    await connectToDatabase();
    
    // Fetch order first to check status and amount
    const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
    if (!order) {
      console.warn(`[webhook] Order not found for razorpayOrderId: ${payment.order_id}`);
      return;
    }

    // Never overwrite "paid"
    if (order.paymentStatus === "paid") {
      console.log(`[webhook] Order ${payment.order_id} is already paid. Ignoring.`);
      return;
    }

    // Compare amount
    if (order.totalPaise !== payment.amount) {
      console.error(`[webhook] Amount mismatch for order ${payment.order_id}. Expected: ${order.totalPaise}, Got: ${payment.amount}`);
      // Mark as failed or flag it, but don't mark as paid
      order.notes = (order.notes || "") + `\nAmount mismatch: expected ${order.totalPaise}, paid ${payment.amount}`;
      await order.save();
      return;
    }

    // Deduct inventory
    for (const item of order.items) {
      // Order items carry productId (not slug). Never decrement below zero.
      await Product.findOneAndUpdate(
        { _id: item.productId, stockCount: { $gte: item.quantity } },
        { $inc: { stockCount: -item.quantity } }
      );
    }

    // Mark order as PAID
    await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          paymentStatus: "paid",
          razorpayPaymentId: payment.id,
        },
        $push: {
          statusHistory: {
            status: "payment_captured",
            note: `Payment captured successfully via Razorpay (${payment.id})`,
            at: new Date(),
          },
        },
      }
    );
    console.log(`[webhook] Order ${payment.order_id} marked as paid and inventory deducted`);
    await notifyOrderPlaced(String(order._id));
  } catch (err) {
    console.error("[webhook] Failed to handle payment captured:", err);
  }
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payload?.payment?.entity;

  // Mark order as failed in database
  try {
    await connectToDatabase();
    const rzpOrderId = str(payment?.order_id);
    if (!rzpOrderId) return;
    const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
    if (!order || order.paymentStatus === "paid") return; // never overwrite paid

    await Order.findByIdAndUpdate(
      order._id,
      {
        $set: { paymentStatus: "failed" },
        $push: {
          statusHistory: {
            status: "payment_failed",
            note: `Payment failed (${payment?.id})`,
            at: new Date(),
          },
        },
      }
    );
  } catch (err) {
    console.error("[webhook] Failed to update failed order:", err);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Read raw body as text (the signature covers the exact bytes, so it is NOT run through parseJsonBody)
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const rawBody = await req.text();
  if (rawBody.length > MAX_WEBHOOK_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 2. Verify webhook signature
  if (!(await verifySignature(rawBody, signature))) {
    console.warn("[webhook] Invalid Razorpay signature — request rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse event
  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // 4. Await DB work before returning to avoid Serverless timeout
  try {
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      default:
        console.log(`[webhook] Unhandled event: ${event.event}`);
    }
  } catch (err) {
    console.error("[webhook] Event handler error:", err);
    // If we fail processing, we can return 500 so Razorpay retries
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
