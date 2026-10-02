import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { getRazorpayConfig, getWebhookSecret, verifyPaymentSignature, verifyWebhookSignature } from "./razorpay";

const hmac = (secret: string, data: string) => crypto.createHmac("sha256", secret).update(data).digest("hex");

describe("getRazorpayConfig", () => {
  it("is null when nothing is set", () => expect(getRazorpayConfig({} as any)).toBeNull());
  it("treats the template placeholders as unset", () => {
    expect(getRazorpayConfig({ NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_XXXXXXXXXXXXXXXXXX", RAZORPAY_KEY_SECRET: "your_razorpay_secret_here" } as any)).toBeNull();
  });
  it("is null when only the id is real", () => expect(getRazorpayConfig({ RAZORPAY_KEY_ID: "rzp_test_abc123", RAZORPAY_KEY_SECRET: "" } as any)).toBeNull());
  it("accepts real keys and falls back to the public key id", () => {
    expect(getRazorpayConfig({ NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_Ab12Cd34", RAZORPAY_KEY_SECRET: "s3cr3tvalue" } as any)).toEqual({ keyId: "rzp_test_Ab12Cd34", keySecret: "s3cr3tvalue" });
  });
  it("tolerates quotes and spaces around values", () => {
    expect(getRazorpayConfig({ RAZORPAY_KEY_ID: ' "rzp_live_Real1" ', RAZORPAY_KEY_SECRET: "'sec'" } as any)).toEqual({ keyId: "rzp_live_Real1", keySecret: "sec" });
  });
  it("webhook secret placeholder is unset", () => {
    expect(getWebhookSecret({ RAZORPAY_WEBHOOK_SECRET: "your_razorpay_webhook_secret_here" } as any)).toBeNull();
    expect(getWebhookSecret({ RAZORPAY_WEBHOOK_SECRET: "whsec_123" } as any)).toBe("whsec_123");
  });
});

describe("verifyPaymentSignature", () => {
  const secret = "topsecret";
  const sig = hmac(secret, "order_1|pay_1");
  it("accepts the genuine signature", () => expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true));
  it("rejects a tampered order, payment or secret", () => {
    expect(verifyPaymentSignature("order_2", "pay_1", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "other")).toBe(false);
  });
  it("rejects malformed signatures without throwing", () => {
    for (const bad of ["", "zz", "abc", sig.slice(1), sig + "00", "' OR 1=1 --"]) expect(verifyPaymentSignature("order_1", "pay_1", bad, secret)).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured" });
  const sig = hmac("whsec", body);
  it("accepts the genuine signature", () => expect(verifyWebhookSignature(body, sig, "whsec")).toBe(true));
  it("rejects when the body changes", () => expect(verifyWebhookSignature(body + " ", sig, "whsec")).toBe(false));
});
