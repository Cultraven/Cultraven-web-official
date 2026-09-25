/**
 * Homepage — CULTRAVEN storefront.
 *
 * Async RSC: fetches all data server-side (parallel), passes typed props to
 * each section component. No client-side data fetching.
 *
 * Sections (top → bottom, modeled on luxury menswear reference):
 *   1. HeroBanner (Dual-Panel Split Motorsport & Coastal Riviera)
 *   2. CategoryTiles (4 Embossed Metallic Gold Cards + Curated Photo Categories)
 *   3. TrendingNow (Lookbook with Technical Feature Callouts)
 *   4. PigmentumCollection (Shop Pigmentum Artistic Studio Showcase)
 *   5. TrustBadges (4 Luxury Seals)
 *   6. ProductCarousel × 3 (New Arrivals, Bestsellers, The Shirt Studio)
 *   7. EditorialBanner (The Sovereign Cut AW26)
 *   8. ReviewCarousel (Verified Patron Testimonials)
 *   9. NewsletterSignup (VIP Circle Privilege)
 */

import type { Metadata } from "next";
import { getHomepageCms, getFeaturedProducts } from "@/lib/api";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { TrendingNow } from "@/components/home/TrendingNow";
import { PigmentumCollection } from "@/components/home/PigmentumCollection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "New Arrivals & Limited Drops | CULTRAVEN — Wear Your Difference",
  description:
    "Shop CULTRAVEN's latest drops — oversized 260 GSM heavyweights, acid-state washes, mythic graphic tees & cargo pants. India's Gen Z streetwear cult. Free delivery above ₹999.",
  alternates: {
    canonical: "/",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Parallel data fetching — both requests fire simultaneously
  const [cms, featured] = await Promise.allSettled([
    getHomepageCms(),
    getFeaturedProducts(),
  ]);

  const cmsData = cms.status === "fulfilled" ? cms.value : null;
  const featuredData =
    featured.status === "fulfilled"
      ? featured.value
      : { newArrivals: [], bestsellers: [], categorySpotlight: [] };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultraven.com";

  // Map product rail configs to their data
  const railProducts: Record<string, typeof featuredData.newArrivals> = {
    "new-arrivals": featuredData.newArrivals,
    bestsellers: featuredData.bestsellers,
    "category-spotlight": featuredData.categorySpotlight,
  };

  return (
    <div className="w-full bg-[var(--bg-primary)]">
      {/* 1 — Dual-Panel Split Campaign Hero */}
      {cmsData?.heroSlide && (
        <HeroBanner slide={cmsData.heroSlide} siteUrl={siteUrl} />
      )}

      {/* 2 — Category Shortcut Tiles (Gold 3D Embossed + Photo Cards) */}
      <CategoryTiles />

      {/* 3 — Trending Now Editorial Lookbook with Technical Badges */}
      <TrendingNow />

      {/* 4 — Shop Pigmentum Signature Color Collection */}
      <PigmentumCollection />

      {/* 5 — Trust Badges */}
      {cmsData?.trustBadges && cmsData.trustBadges.length > 0 && (
        <TrustBadges badges={cmsData.trustBadges} />
      )}

      {/* 6 — Product Carousels (New Arrivals, Bestsellers, Shirt Studio) */}
      {cmsData?.productRails?.map((railConfig) => (
        <ProductCarousel
          key={railConfig.id}
          config={railConfig}
          products={railProducts[railConfig.railType] ?? []}
        />
      ))}

      {/* 7 — Editorial Lifestyle Banner */}
      {cmsData?.editorialBanner && (
        <EditorialBanner banner={cmsData.editorialBanner} />
      )}

      {/* 9 — VIP Club Newsletter Signup */}
      {cmsData?.newsletter && (
        <NewsletterSignup config={cmsData.newsletter} />
      )}
    </div>
  );
}
