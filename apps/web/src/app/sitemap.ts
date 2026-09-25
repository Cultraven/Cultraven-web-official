/**
 * sitemap.ts — generates sitemap.xml for Googlebot.
 *
 * Includes:
 *   - Static marketing pages
 *   - All active product slugs (from catalog-service)
 *   - Category pages
 *
 * Next.js automatically serves this at /sitemap.xml
 */

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";

interface ProductSlugPayload {
  slugs: string[];
}

async function getProductSlugs(): Promise<string[]> {
  try {
    const serviceUrl =
      process.env.CATALOG_SERVICE_URL ?? "http://localhost:4003/api/v1";
    const res = await fetch(`${serviceUrl}/products/slugs`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as ProductSlugPayload;
    return data.slugs;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productSlugs = await getProductSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/collections/all`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/collections/new-in`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/collections/bestsellers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/category/shirts`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/category/suits`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/category/blazers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/category/tshirts`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/category/jeans`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/category/accessories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/returns`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/shipping-policy`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${BASE}/product/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
