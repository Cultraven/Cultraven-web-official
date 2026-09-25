import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Reset Password | CULTRAVEN",
  description: "Reset your CULTRAVEN account credentials.",
};

export default function ForgotPasswordPage() {
  return (
    <ComingSoon
      page="Password Recovery"
      description="Member account self-service and password recovery will be active once customer authentication opens."
      showNotify={false}
    />
  );
}
