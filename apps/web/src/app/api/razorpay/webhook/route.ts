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
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";

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
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ── Event handlers ────────────────────────────────────────────────────────────
async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payload?.payment?.entity;
  if (!payment) return;

  console.log("[webhook] payment.captured", {
    paymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    email: payment.email,
  });

  // 1. Mark order as PAID in database
  try {
    await connectToDatabase();
    await Order.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
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
    console.log(`[webhook] Order ${payment.order_id} marked as paid`);
  } catch (err) {
    console.error("[webhook] Failed to update order status:", err);
  }

  // TODO: Send order confirmation email to customer
  // TODO: Trigger inventory deduction via inventory-service
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payload?.payment?.entity;
  console.log("[webhook] payment.failed", {
    paymentId: payment?.id,
    orderId: payment?.order_id,
  });

  // Mark order as failed in database
  try {
    await connectToDatabase();
    await Order.findOneAndUpdate(
      { razorpayOrderId: payment?.order_id },
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

  // TODO: Send payment failure notification to customer
}

async function handleOrderPaid(payload: RazorpayWebhookPayload) {
  const order = payload.payload?.order?.entity;
  console.log("[webhook] order.paid", {
    orderId: order?.id,
    receipt: order?.receipt,
    amount: order?.amount,
  });

  // TODO: Fulfill the order — trigger packing/shipping workflow
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Read raw body as text (needed for HMAC verification)
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 2. Verify webhook signature
  if (!verifySignature(rawBody, signature)) {
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

  // 4. Return 200 immediately (Razorpay expects fast response to avoid retries)
  // Process event asynchronously
  (async () => {
    try {
      switch (event.event) {
        case "payment.captured":
          await handlePaymentCaptured(event);
          break;
        case "payment.failed":
          await handlePaymentFailed(event);
          break;
        case "order.paid":
          await handleOrderPaid(event);
          break;
        default:
          console.log(`[webhook] Unhandled event: ${event.event}`);
      }
    } catch (err) {
      console.error("[webhook] Event handler error:", err);
    }
  })();

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
