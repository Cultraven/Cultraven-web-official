/**
 * POST /api/razorpay/verify
 *
 * Server-side payment verification after Razorpay checkout completes.
 * NEVER trust the frontend alone — always verify signature here.
 *
 * Security:
 * - HMAC-SHA256 signature verification using Razorpay order_id + payment_id
 * - Marks order as paid in DB only after successful verification
 */

import { NextRequest, NextResponse, after } from "next/server";
import { notifyOrderPlaced } from "@/lib/order-notify";
import { getRazorpayConfigAsync, verifyPaymentSignature } from "@/lib/razorpay";
import { clientIp, isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";

// Razorpay ids look like order_Abc123 / pay_Abc123; the signature is a hex HMAC. Anything else is junk.
const VerifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_]+$/),
  razorpay_payment_id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_]+$/),
  razorpay_signature: z.string().min(1).max(256).regex(/^[A-Fa-f0-9]+$/),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Guessing a signature is pointless (HMAC), but cap the attempts anyway.
  const rl = rateLimit(`verify:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: retryHeaders(rl) });

  const parsedBody = await parseJsonBody(req, 4 * 1024);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  const body = parsedBody.data;

  const result = VerifySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Missing required payment fields", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = result.data;

  // ignoreSwitch: a payment that already started must still be verifiable after the admin turns online payments off.
  const cfg = await getRazorpayConfigAsync({ ignoreSwitch: true });
  if (!cfg) {
    return NextResponse.json({ error: "Online payments are not configured", code: "PAYMENTS_NOT_CONFIGURED" }, { status: 503 });
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, cfg.keySecret);

  if (!isValid) {
    console.warn(`[verify] Signature mismatch for order ${razorpay_order_id}`);
    return NextResponse.json({ verified: false, error: "Invalid payment signature" }, { status: 400 });
  }

  // Signature valid — mark order paid in DB
  try {
    await connectToDatabase();
    // Only a not-yet-paid order is updated: a replayed callback can't append duplicate history or re-trigger emails.
    const paid = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
        },
        $push: {
          statusHistory: {
            status: "payment_verified",
            note: `Payment verified client-side (${razorpay_payment_id})`,
            at: new Date(),
          },
        },
      },
      { new: true }
    );
    if (paid) after(() => notifyOrderPlaced(String(paid._id)));
  } catch (err) {
    console.error("[verify] DB update failed:", err);
    // Still return verified: true — payment is real, webhook will handle DB
  }

  return NextResponse.json({ verified: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
