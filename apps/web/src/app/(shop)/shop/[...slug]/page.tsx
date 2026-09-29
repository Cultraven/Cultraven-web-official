import type { Metadata } from "next";
import CategoryClient from "../../category/[slug]/CategoryClient";

interface ShopPageProps {
  params: Promise<{ slug: string[] }>;
}

function formatTitle(slugArray: string[]): string {
  if (!slugArray || slugArray.length === 0) return "Shop";
  const lastSegment = slugArray[slugArray.length - 1];
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = formatTitle(slug);
  return {
    title: `${name} | CULTRAVEN Drops`,
    description: `Explore the ${name} collection from CULTRAVEN. Gen Z heavyweight streetwear crafted for the uncommon.`,
  };
}

export default async function ShopCatchAllPage({ params }: ShopPageProps) {
  const { slug } = await params;
  const categoryName = formatTitle(slug);
  const lastSlug = slug[slug.length - 1] || "all";
  
  return <CategoryClient slug={lastSlug} categoryName={categoryName} />;
}
