/**
 * sitemap.ts: sitemap.xml for Google.
 * Lists the shop pages, every collection set up in Admin -> Website content -> Collections, and every product (read from the same database the shop uses).
 */

import type { MetadataRoute } from "next";
import { getCmsSection, getProducts } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";
const ALWAYS = ["all", "new-in", "bestsellers"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getProducts("all", 500), getCmsSection<any>("shop.collections")]);
  const slugs = Array.from(new Set([...ALWAYS, ...liveItems<any>(collections.data?.items).map((c) => String(c.slug || "")).filter(Boolean)]));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    ...slugs.map((slug) => ({ url: `${BASE}/collections/${slug}`, changeFrequency: "daily" as const, priority: slug === "all" || slug === "new-in" ? 0.9 : 0.8 })),
    { url: `${BASE}/pages/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/pages/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/help`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/pages/size-guide`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/pages/returns`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/pages/shipping`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/pages/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/pages/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = (products.data ?? []).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
