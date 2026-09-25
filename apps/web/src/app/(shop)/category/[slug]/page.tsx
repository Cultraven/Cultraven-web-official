import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = formatTitle(slug);
  return {
    title: `${name} | CULTRAVEN Drops`,
    description: `Explore the limited ${name} drop from CULTRAVEN. Gen Z heavyweight streetwear crafted for the uncommon.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = formatTitle(slug);

  return (
    <ComingSoon
      page={`${categoryName} Collection`}
      description={`The ${categoryName} drop is currently being curated in limited quantities with 260+ GSM heavyweights, custom dyes, and mythic graphic details. Drop notification list is open.`}
    />
  );
}
