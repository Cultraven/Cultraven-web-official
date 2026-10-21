import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductClient";
import { getProductBySlug, getProducts } from "@/lib/cms/server";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ slug: string }> }

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: p } = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.description.slice(0, 160);
  const title = `${p.title} | Buy Online in India`;
  return {
    title: { absolute: `${title} | CULTRAVEN` },
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: p.title, description, type: "website", images: p.image ? [p.image] : undefined },
    twitter: { card: "summary_large_image", title: p.title, description, images: p.image ? [p.image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProductBySlug(slug), getProducts("all", 12)]);
  if (!product.data) notFound();
  const p = product.data;

  const related = (all.data ?? [])
    .filter((x) => x.slug !== slug)
    .slice(0, 4)
    .map((x) => ({ id: x.id, title: x.title, price: x.pricePaise, image: x.image, href: x.href }));

  // Product + breadcrumb data for Google (shows price and stock in search results).
  const url = `${SITE}/products/${slug}`;
  const photos = (p.images?.length ? p.images : [p.image]).filter(Boolean).map(abs);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.title,
        description: p.description,
        image: photos,
        brand: { "@type": "Brand", name: "CULTRAVEN" },
        ...(p.category ? { category: p.category } : {}),
        ...(p.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } } : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "INR",
          price: (p.pricePaise / 100).toFixed(2),
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/collections/all` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductDetailClient product={p} related={related} />
    </>
  );
}
