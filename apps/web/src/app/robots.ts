/**
 * robots.ts — generates robots.txt
 *
 * Allows all crawlers on public storefront pages.
 * Blocks: API routes, admin paths, auth pages, internal Next.js assets.
 *
 * Next.js serves this at /robots.txt
 */

import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultraven.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/account/",
          "/cart",
          "/checkout/",
          "/search",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
