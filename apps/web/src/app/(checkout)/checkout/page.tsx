import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Checkout | CULTRAVEN",
  description: "Secure checkout for CULTRAVEN apparel.",
};

export default function CheckoutPage() {
  return (
    <ComingSoon
      page="Express Checkout"
      description="Razorpay, UPI, cards, and COD payment options are being integrated for our upcoming drop release."
    />
  );
}
