import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Join The Cult | CULTRAVEN",
  description: "Create your CULTRAVEN member account. Wear your difference.",
};

export default function RegisterPage() {
  return (
    <ComingSoon
      page="Join The Cult"
      description="Member registration includes ₹500 off your first drop order, secret drop links, and invitation-only streetwear capsules. Join the waitlist below."
    />
  );
}
