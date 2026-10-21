import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Need help with an order? Call, WhatsApp or email CULTRAVEN. We reply fast, Mon to Sat.",
  alternates: { canonical: "/pages/contact" },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
