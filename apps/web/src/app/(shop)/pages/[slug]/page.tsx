import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return [{ slug: "about" }, { slug: "contact" }, { slug: "faq" }, { slug: "returns" }, { slug: "shipping-policy" }, { slug: "privacy-policy" }, { slug: "terms" }];
}

export async function generateMetadata({
  params,
}: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = formatTitle(slug);
  return {
    title: `${title} | CULTRAVEN`,
    description: `Read about CULTRAVEN's ${title}. A culture for the uncommon.`,
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  const title = formatTitle(slug);

  return (
    <ComingSoon
      page={title}
      description={`The full story behind ${title} is being documented. From our manifesto to fabrication ethics, our narrative will be published shortly.`}
    />
  );
}
