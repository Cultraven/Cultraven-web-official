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
    return await api.get<HomepageCms>("/cms/home");
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
    return await api.get<FeaturedProductsPayload>("/products/featured");
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
