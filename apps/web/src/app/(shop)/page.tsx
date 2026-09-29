/**
 * Homepage — CULTRAVEN storefront.
 *
 * Section order (matches brand spec):
 *   1.  HeroBanner           — full-screen campaign
 *   2.  NewDropSection       — editorial product grid "NEW DROP"
 *   3.  CategoryTiles        — shop by category (8 categories)
 *   4.  BestsellersSection   — "THE ONES EVERYONE WANTS."
 *   5.  EditorialBanner      — "THE CULTRAVEN IDENTITY" campaign
 *   6.  FeaturedCollection   — Street collection editorial split
 *   7.  ShopTheLook          — model image + shoppable product list
 *   8.  BrandStory           — "THE CULTURE" manifesto
 *   9.  TrendingNow          — lookbook / latest drop editorial grid
 *  10.  CommunitySection     — "WORN BY THE CULTURE" UGC grid
 *  11.  TrustBadges          — service trust strip
 *  12.  NewsletterSignup     — "JOIN THE CULTURE." email signup
 */

import type { Metadata } from "next";
import { getHomepageCms } from "@/lib/api";
import { HeroBanner } from "@/components/home/HeroBanner";
import { NewDropSection } from "@/components/home/NewDropSection";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { BestsellersSection } from "@/components/home/BestsellersSection";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { FeaturedCollectionSection } from "@/components/home/FeaturedCollectionSection";
import { ShopTheLookSection } from "@/components/home/ShopTheLookSection";
import { BrandStorySection } from "@/components/home/BrandStorySection";
import { TrendingNow } from "@/components/home/TrendingNow";
import { CommunitySection } from "@/components/home/CommunitySection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "NOT MADE TO BLEND IN. | CULTRAVEN — Gen Z Streetwear India",
  description:
    "Shop CULTRAVEN's latest drops — oversized 260 GSM heavyweights, acid-state washes, mythic graphic tees & cargo pants. India's Gen Z streetwear cult. Free delivery above ₹999.",
  alternates: {
    canonical: "/",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  let cmsData = null;
  try {
    cmsData = await getHomepageCms();
  } catch {
    // Graceful fallback — static sections still render
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";

  return (
    <div className="w-full">
      {/* 1 — Full-screen campaign hero */}
      {cmsData?.heroSlide && (
        <HeroBanner slide={cmsData.heroSlide} siteUrl={siteUrl} />
      )}

      {/* 2 — New Drop: editorial product grid */}
      <NewDropSection />

      {/* 3 — Shop By Category: 8 category tiles */}
      <CategoryTiles />

      {/* 4 — Bestsellers: "THE ONES EVERYONE WANTS." */}
      <BestsellersSection />

      {/* Sections 5 & 6 removed per user request */}

      {/* 7 — Shop The Look: model image + shoppable product list */}
      <ShopTheLookSection />

      {/* 8 — Brand Story: "THE CULTURE" manifesto */}
      <BrandStorySection />

      {/* 9 — Latest Drop / Lookbook editorial grid */}
      <TrendingNow />

      {/* 10 — Community / Social UGC grid */}
      <CommunitySection />

      {/* 11 — Trust / service strip */}
      {cmsData?.trustBadges && cmsData.trustBadges.length > 0 && (
        <TrustBadges badges={cmsData.trustBadges} />
      )}

      {/* 12 — Newsletter: "JOIN THE CULTURE." */}
      {cmsData?.newsletter && (
        <NewsletterSignup config={cmsData.newsletter} />
      )}
    </div>
  );
}
