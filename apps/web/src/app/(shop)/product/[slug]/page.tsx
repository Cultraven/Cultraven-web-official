import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return []; // Products will be generated on demand
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = formatTitle(slug);
  return {
    title: `${name} | CULTRAVEN Official Drop`,
    description: `Official drop page for ${name}. Handcrafted heavyweight streetwear by CULTRAVEN.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productName = formatTitle(slug);

  return (
    <ComingSoon
      page={productName}
      description={`"${productName}" is in final artisan production. Custom wash, oversized silhouette, premium ribbing. Register your email for priority early access when this drop goes live.`}
    />
  );
}
