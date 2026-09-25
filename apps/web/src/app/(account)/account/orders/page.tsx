import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Order Tracking & History | CULTRAVEN",
  description: "Track your CULTRAVEN drop orders and delivery updates in real-time.",
};

export default function OrdersPage() {
  return (
    <ComingSoon
      page="Order History & Tracking"
      description="Real-time order dispatch tracking, airway bill updates, and drop purchase archives will be available here when orders ship."
    />
  );
}
