import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "All Collections",
  description: "Browse all CULTRAVEN collections: new arrivals, best sellers and everyday essentials.",
};

export const dynamic = "force-static";

export default function CollectionsPage() {
  return (
    <ComingSoon
      page="All Collections"
      description="Our full collections page is launching soon. Subscribe to get notified, or browse all products in the meantime."
    />
  );
}
