import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Search Catalog | CULTRAVEN",
  description: "Search CULTRAVEN streetwear drops, oversized tees, and accessories.",
};

export default function SearchPage() {
  return (
    <ComingSoon
      page="Search Drops"
      description="Live instant search, drop archive filters, and size matching are launching with our upcoming drop."
    />
  );
}
