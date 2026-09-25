import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Saved Wishlist | CULTRAVEN",
  description: "Your saved pieces and upcoming drop wishlist.",
};

export default function WishlistPage() {
  return (
    <ComingSoon
      page="Saved & Wishlist"
      description="Save your favourite heavyweight oversized tees, distressed acid washes, and cargo drops for rapid checkout upon release."
    />
  );
}
