import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Member Account | CULTRAVEN",
  description: "CULTRAVEN member portal. Access your orders, drop passes, and preferences.",
};

export default function AccountPage() {
  return (
    <ComingSoon
      page="Member Portal"
      description="The CULTRAVEN member portal is launching soon with exclusive drop passes, tier perks, saved delivery profiles, and express checkout."
    />
  );
}
