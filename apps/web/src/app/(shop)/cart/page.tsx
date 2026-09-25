import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Shopping Bag | CULTRAVEN",
  description: "Your CULTRAVEN cart and bag. Secure checkout launching soon.",
};

export default function CartPage() {
  return (
    <ComingSoon
      page="Shopping Bag"
      description="The cart and high-speed drop checkout system are being configured for our first public drop. Stay tuned."
    />
  );
}
