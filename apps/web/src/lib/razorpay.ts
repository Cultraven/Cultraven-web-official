/**
 * Razorpay configuration + signature helpers (server-only).
 *
 * The keys are NOT set yet: the integration is fully wired and just waits for real values in
 * `.env` (see `.env.example`). Until then online payments answer "not configured" while
 * Cash on Delivery keeps working.
 */

import crypto from "crypto";

/** Values copied from the template count as "not set". */
const PLACEHOLDER = /^(|your_.*|rzp_(test|live)_x+|x+|changeme|todo)$/i;

function real(v: string | undefined): string | null {
  const t = (v ?? "").trim().replace(/^["']+|["']+$/g, "");
  return PLACEHOLDER.test(t) ? null : t;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

/** Key id + secret, or null while they are missing / still placeholders. The key id falls back to the public one. */
export function getRazorpayConfig(env: NodeJS.ProcessEnv = process.env): RazorpayConfig | null {
  const keyId = real(env.RAZORPAY_KEY_ID) ?? real(env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const keySecret = real(env.RAZORPAY_KEY_SECRET);
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export function getWebhookSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  return real(env.RAZORPAY_WEBHOOK_SECRET);
}

function safeHexEqual(expectedHex: string, givenHex: string): boolean {
  if (!/^[0-9a-f]+$/i.test(givenHex) || givenHex.length !== expectedHex.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(givenHex, "hex"));
}

/** Checkout-complete signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeHexEqual(expected, signature);
}

/** Webhook signature: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeHexEqual(expected, signature);
}
