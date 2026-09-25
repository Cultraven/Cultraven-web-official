import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Member Login | CULTRAVEN",
  description: "Sign in to your CULTRAVEN account for drop access.",
};

export default function LoginPage() {
  return (
    <ComingSoon
      page="Member Sign In"
      description="Member access unlocks with our inaugural streetwear drop. Get notified the moment member authentication goes live."
    />
  );
}
