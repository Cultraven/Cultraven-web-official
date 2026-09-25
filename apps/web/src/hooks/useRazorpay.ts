/**
 * useRazorpay — Razorpay checkout hook.
 *
 * Usage:
 *   const { openCheckout, isLoading, error } = useRazorpay();
 *   openCheckout({ amountPaise: 299900, productName: "Slim-Fit Blazer" });
 *
 * Flow:
 *   1. POST /api/payment/create-order  → Razorpay order_id
 *   2. Load Razorpay SDK (if not loaded)
 *   3. Open checkout modal
 *   4. On success: POST /api/payment/verify
 *   5. Call onSuccess / onFailure callbacks
 */

"use client";

import { useState, useCallback } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface OpenCheckoutParams {
  amountPaise: number;
  productName: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (paymentId: string) => void;
  onFailure?: (reason: string) => void;
}

interface CreateOrderResponse {
  orderId: string;
}

interface VerifyPaymentResponse {
  verified: boolean;
}

// ─── Razorpay SDK loader ──────────────────────────────────────────────────────

function loadRazorpaySdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCheckout = useCallback(
    async ({
      amountPaise,
      productName,
      description = "CULTRAVEN Order",
      prefill,
      onSuccess,
      onFailure,
    }: OpenCheckoutParams) => {
      setIsLoading(true);
      setError(null);

      try {
        // 1 — Load SDK
        await loadRazorpaySdk();

        // 2 — Create server-side Razorpay order
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountPaise }),
        });
        if (!res.ok) throw new Error("Failed to create payment order");
        const { orderId } = (await res.json()) as CreateOrderResponse;

        // 3 — Open Razorpay modal
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
          amount: amountPaise,
          currency: "INR",
          name: "CULTRAVEN",
          description: `${productName} — ${description}`,
          order_id: orderId,
          prefill,
          theme: { color: "#C9A84C" },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              // 4 — Verify signature server-side
              const vRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const { verified } = (await vRes.json()) as VerifyPaymentResponse;
              if (verified) {
                onSuccess?.(response.razorpay_payment_id);
              } else {
                throw new Error("Payment verification failed");
              }
            } catch (verifyErr) {
              const msg =
                verifyErr instanceof Error
                  ? verifyErr.message
                  : "Verification error";
              setError(msg);
              onFailure?.(msg);
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              onFailure?.("Payment cancelled");
            },
          },
        });

        rzp.open();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Checkout error";
        setError(msg);
        setIsLoading(false);
        onFailure?.(msg);
      }
    },
    []
  );

  return { openCheckout, isLoading, error };
}
