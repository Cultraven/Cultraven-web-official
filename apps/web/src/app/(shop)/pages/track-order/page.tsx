import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Order tracking by order number is coming soon. Signed-in customers can follow every order in Account, Orders.",
};

/** Tracking by order number is not built yet. Customers can already follow an order in Account -> Orders and in their order emails. */
export default function TrackOrderPage() {
  return (
    <ComingSoon
      page="Order tracking"
      description="Tracking by order number is coming soon. Until then, sign in and open Account, then Orders, to follow your order step by step. Every order email also has a Track my order button."
      showNotify={false}
    />
  );
}
