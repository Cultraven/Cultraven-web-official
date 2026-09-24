import crypto from "node:crypto";

// Always verify webhook signatures against the RAW request body, and treat webhooks as the source of truth.
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// TODO(Sprint 4): createOrder(), verifyCheckoutSignature(), refund()
