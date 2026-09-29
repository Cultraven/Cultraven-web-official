/**
 * Server-side API helpers.
 *
 * All data-fetching in RSC pages/layouts calls these functions.
 * They hit the API gateway (or direct service URLs) using @shop/api-client.
 * Base URL from NEXT_PUBLIC_API_URL env var.
 *
 * All functions throw on non-OK responses — callers handle with try/catch.
 */

import { createApiClient } from "@shop/api-client";
import type { HomepageCms } from "@shop/types";
import type { Product } from "@shop/types";

import { HOMEPAGE_CMS_FIXTURE, FEATURED_PRODUCTS_FIXTURE } from "./fixtures";

// ─── API client (server-only, no auth token needed for public routes) ────────

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
});

// ─── CMS ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the full homepage CMS payload.
 * In development / offline, falls back to rich HOMEPAGE_CMS_FIXTURE.
 */
export async function getHomepageCms(): Promise<HomepageCms> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/cms/hero`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const dbBanners = data.banners || [];
      // If DB has banners, use them. Otherwise fallback to fixture.
      if (dbBanners.length > 0) {
        return {
          ...HOMEPAGE_CMS_FIXTURE,
          heroSlide: dbBanners[0], // using first active banner
        };
      }
    }
    return HOMEPAGE_CMS_FIXTURE;
  } catch {
    return HOMEPAGE_CMS_FIXTURE;
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface FeaturedProductsPayload {
  newArrivals: Product[];
  bestsellers: Product[];
  categorySpotlight: Product[];
}

export async function getFeaturedProducts(): Promise<FeaturedProductsPayload> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/products`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const products = data.products || [];
      if (products.length > 0) {
        // Map DB structure to frontend Product structure
        const mapped = products.map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          pricePaise: p.pricePaise,
          mrpPaise: p.mrpPaise,
          category: p.category,
          image: p.image,
          hoverImage: p.hoverImage || p.image,
          badge: p.badge,
        }));
        return {
          newArrivals: mapped.slice(0, 4),
          bestsellers: mapped.slice(0, 8),
          categorySpotlight: mapped.slice(0, 4),
        };
      }
    }
    return FEATURED_PRODUCTS_FIXTURE;
  } catch {
    return FEATURED_PRODUCTS_FIXTURE;
  }
}

// ─── Delivery location ────────────────────────────────────────────────────────

export async function detectDeliveryCity(
  pincode?: string
): Promise<string> {
  if (!pincode) return "Delhi";
  try {
    const { city } = await api.get<{ city: string }>(
      `/delivery/city?pincode=${pincode}`
    );
    return city;
  } catch {
    return "Delhi";
  }
}
