/**
 * GET /api/products/featured
 *
 * Returns:
 *   { newArrivals: Product[], bestsellers: Product[], categorySpotlight: Product[] }
 *
 * In development returns a fixture; in production proxies to catalog-service.
 */

import { NextResponse } from "next/server";
import type { Product } from "@shop/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedPayload {
  newArrivals: Product[];
  bestsellers: Product[];
  categorySpotlight: Product[];
}

// ─── Fixture helper ───────────────────────────────────────────────────────────

function makeProduct(
  overrides: Partial<Product> & { id: string; slug: string; title: string }
): Product {
  return {
    description: "",
    categoryIds: [],
    images: [
      `https://picsum.photos/seed/${overrides.id}/480/600`,
      `https://picsum.photos/seed/${overrides.id}b/480/600`,
    ],
    variants: [
      {
        sku: `${overrides.id}-M`,
        size: "M",
        color: "Black",
        pricePaise: 299900,
        mrpPaise: 399900,
        stock: 50,
      },
      {
        sku: `${overrides.id}-L`,
        size: "L",
        color: "Black",
        pricePaise: 299900,
        mrpPaise: 399900,
        stock: 40,
      },
    ],
    status: "active",
    isNewArrival: false,
    isBestseller: false,
    isFeatured: false,
    ...overrides,
  };
}

const FIXTURE_PRODUCTS: FeaturedPayload = {
  newArrivals: [
    makeProduct({ id: "p1", slug: "slim-fit-blazer-charcoal", title: "Slim-Fit Blazer — Charcoal", isNewArrival: true, variants: [{ sku: "p1-M", size: "M", color: "Charcoal", pricePaise: 549900, mrpPaise: 749900, stock: 20 }] }),
    makeProduct({ id: "p2", slug: "italian-linen-shirt-stone", title: "Italian Linen Shirt — Stone", isNewArrival: true, variants: [{ sku: "p2-M", size: "M", color: "Stone", pricePaise: 249900, mrpPaise: 299900, stock: 35 }] }),
    makeProduct({ id: "p3", slug: "slim-chinos-khaki", title: "Slim Chinos — Khaki", isNewArrival: true, variants: [{ sku: "p3-M", size: "M", color: "Khaki", pricePaise: 199900, stock: 60 }] }),
    makeProduct({ id: "p4", slug: "graphic-tee-monochrome", title: "Monochrome Graphic Tee", isNewArrival: true, variants: [{ sku: "p4-M", size: "M", color: "White", pricePaise: 89900, mrpPaise: 129900, stock: 100 }] }),
    makeProduct({ id: "p5", slug: "formal-trouser-midnight", title: "Formal Trousers — Midnight", isNewArrival: true, variants: [{ sku: "p5-M", size: "M", color: "Midnight", pricePaise: 279900, mrpPaise: 349900, stock: 25 }] }),
    makeProduct({ id: "p6", slug: "polo-off-white", title: "Classic Polo — Off White", isNewArrival: true, variants: [{ sku: "p6-M", size: "M", color: "Off White", pricePaise: 159900, stock: 80 }] }),
  ],
  bestsellers: [
    makeProduct({ id: "b1", slug: "classic-oxford-shirt-navy", title: "Classic Oxford Shirt — Navy", isBestseller: true, variants: [{ sku: "b1-M", size: "M", color: "Navy", pricePaise: 219900, mrpPaise: 279900, stock: 45 }] }),
    makeProduct({ id: "b2", slug: "straight-jeans-black", title: "Straight Jeans — Black", isBestseller: true, variants: [{ sku: "b2-32", size: "32", color: "Black", pricePaise: 249900, mrpPaise: 349900, stock: 55 }] }),
    makeProduct({ id: "b3", slug: "crew-neck-tee-charcoal", title: "Crew-Neck Tee — Charcoal", isBestseller: true, variants: [{ sku: "b3-M", size: "M", color: "Charcoal", pricePaise: 79900, mrpPaise: 99900, stock: 200 }] }),
    makeProduct({ id: "b4", slug: "2-piece-suit-slate", title: "2-Piece Suit — Slate Grey", isBestseller: true, variants: [{ sku: "b4-40", size: "40", color: "Slate", pricePaise: 999900, mrpPaise: 1299900, stock: 15 }] }),
    makeProduct({ id: "b5", slug: "casual-blazer-sand", title: "Casual Blazer — Sand", isBestseller: true, variants: [{ sku: "b5-M", size: "M", color: "Sand", pricePaise: 479900, mrpPaise: 599900, stock: 22 }] }),
    makeProduct({ id: "b6", slug: "linen-trousers-oat", title: "Linen Trousers — Oat", isBestseller: true, variants: [{ sku: "b6-M", size: "M", color: "Oat", pricePaise: 229900, stock: 40 }] }),
  ],
  categorySpotlight: [
    makeProduct({ id: "s1", slug: "formal-shirt-white-poplin", title: "White Poplin Formal Shirt", variants: [{ sku: "s1-M", size: "M", color: "White", pricePaise: 189900, mrpPaise: 229900, stock: 70 }] }),
    makeProduct({ id: "s2", slug: "casual-shirt-sky-blue", title: "Sky Blue Casual Shirt", isNewArrival: true, variants: [{ sku: "s2-M", size: "M", color: "Sky Blue", pricePaise: 199900, stock: 50 }] }),
    makeProduct({ id: "s3", slug: "oxford-shirt-burgundy", title: "Oxford Shirt — Burgundy", variants: [{ sku: "s3-M", size: "M", color: "Burgundy", pricePaise: 209900, mrpPaise: 259900, stock: 30 }] }),
    makeProduct({ id: "s4", slug: "linen-shirt-cream", title: "Linen Shirt — Cream", isNewArrival: true, variants: [{ sku: "s4-M", size: "M", color: "Cream", pricePaise: 249900, stock: 35 }] }),
    makeProduct({ id: "s5", slug: "check-shirt-green", title: "Heritage Check Shirt — Green", variants: [{ sku: "s5-M", size: "M", color: "Green", pricePaise: 229900, mrpPaise: 279900, stock: 25 }] }),
    makeProduct({ id: "s6", slug: "denim-shirt-indigo", title: "Denim Shirt — Indigo", variants: [{ sku: "s6-M", size: "M", color: "Indigo", pricePaise: 259900, stock: 40 }] }),
  ],
};

interface FeaturedPayload {
  newArrivals: Product[];
  bestsellers: Product[];
  categorySpotlight: Product[];
}

export async function GET() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const payload: FeaturedPayload = FIXTURE_PRODUCTS;
    return NextResponse.json(payload);
  }

  try {
    const serviceUrl =
      process.env.CATALOG_SERVICE_URL ?? "http://localhost:4003/api/v1";
    const res = await fetch(`${serviceUrl}/products/featured`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) throw new Error(`catalog-service error ${res.status}`);
    const data = (await res.json()) as FeaturedPayload;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/products/featured]", err);
    return NextResponse.json(FIXTURE_PRODUCTS);
  }
}
