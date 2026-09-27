import type { Metadata } from "next";
import ProductDetailClient from "./ProductClient";

interface Props { params: Promise<{ slug: string }> }

function fmtName(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = fmtName(slug);
  return {
    title: `${name} | CULTRAVEN`,
    description: `Shop ${name} — premium heavyweight streetwear by CULTRAVEN. Free shipping above ₹1,999.`,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: `${name} | CULTRAVEN`, description: `Premium Gen-Z streetwear. Shop ${name}.`, type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient productName={fmtName(slug)} />;
}
