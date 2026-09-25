import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Delivery Addresses | CULTRAVEN",
  description: "Manage your delivery addresses for priority drop delivery.",
};

export default function AddressesPage() {
  return (
    <ComingSoon
      page="Delivery Addresses"
      description="Manage your pinned addresses for 1-click drop checkout and expedited pan-India delivery."
    />
  );
}
