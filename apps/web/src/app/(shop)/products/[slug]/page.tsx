import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductClient";
import { getProductBySlug, getProducts } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: p } = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.description.slice(0, 160);
  return {
    title: p.title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: p.title, description, type: "website", images: p.image ? [p.image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProductBySlug(slug), getProducts("all", 12)]);
  if (!product.data) notFound();

  const related = (all.data ?? [])
    .filter((p) => p.slug !== slug)
    .slice(0, 4)
    .map((p) => ({ id: p.id, title: p.title, price: p.pricePaise, image: p.image, href: p.href }));

  return <ProductDetailClient product={product.data} related={related} />;
}
