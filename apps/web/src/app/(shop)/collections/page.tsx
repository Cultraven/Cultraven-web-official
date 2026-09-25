import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "All Collections & Drops | CULTRAVEN",
  description: "Browse all seasonal drops and limited streetwear capsules by CULTRAVEN.",
};

export const dynamic = "force-static";

export default function CollectionsPage() {
  return (
    <ComingSoon
      page="All Collections"
      description="Our seasonal drops, archive silhouettes, and collaborative capsule releases are launching soon. Subscribe for early access."
    />
  );
}
