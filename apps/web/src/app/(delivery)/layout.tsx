import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Delivery · CULTRAVEN", robots: { index: false, follow: false } };

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return children;
}
