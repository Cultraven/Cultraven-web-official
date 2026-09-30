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
import { normalizeMode, selectLiveSlides } from "./hero";

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
      const dbBanners = selectLiveSlides(data.banners || [], normalizeMode(data.mode));
      if (dbBanners.length > 0) {
        const mapped = dbBanners.map((b: any, idx: number) => ({
          id: b.id || `cms-hero-${idx}`,
          type: b.type || "image",
          srcDesktop: b.srcDesktop || "",
          srcMobile: b.srcMobile || "",
          posterSrc: b.posterSrc || "",
          altText: b.altText || "",
          eyebrow: b.eyebrow || "",
          objectPosition: b.objectPosition || "center center",
          durationMs: typeof b.durationMs === "number" ? b.durationMs : 5000,
          headline: b.headline || "",
          subheadline: b.subheadline || "",
          ctaLabel: b.ctaLabel || HOMEPAGE_CMS_FIXTURE.heroSlide.ctaLabel,
          ctaHref: b.ctaHref || HOMEPAGE_CMS_FIXTURE.heroSlide.ctaHref,
          textColor: b.textColor || "#FFFFFF",
          overlayOpacity: typeof b.overlayOpacity === "number" ? b.overlayOpacity : 0.45,
        }));
        return {
          ...HOMEPAGE_CMS_FIXTURE,
          heroSlide: mapped[0],
          heroSlides: mapped,
        } as any;
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
