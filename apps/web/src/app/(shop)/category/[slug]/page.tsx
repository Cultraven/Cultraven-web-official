import type { Metadata } from "next";
import CategoryClient from "./CategoryClient";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function formatTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return [
    { slug: "shirts" }, { slug: "tshirts" }, { slug: "t-shirts" },
    { slug: "jeans" }, { slug: "accessories" }, { slug: "hoodies" },
    { slug: "oversized-tees" }, { slug: "acid-wash" }, { slug: "oversized" },
    { slug: "relaxed" }, { slug: "boxy" }, { slug: "sale" }, { slug: "all" },
  ];
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = formatTitle(slug);
  return {
    title: `${name} | CULTRAVEN Drops`,
    description: `Explore the ${name} collection from CULTRAVEN. Gen Z heavyweight streetwear crafted for the uncommon. Free shipping above ₹999.`,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: `${name} | CULTRAVEN`,
      description: `Shop ${name} — premium Gen-Z streetwear.`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = formatTitle(slug);
  return <CategoryClient slug={slug} categoryName={categoryName} />;
}
