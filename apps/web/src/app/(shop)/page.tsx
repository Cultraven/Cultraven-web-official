/**
 * Homepage — CULTRAVEN storefront.
 *
 * Section order:
 *   1.  HeroBanner           — full-screen campaign carousel
 *   2.  FilmstripMarquee     — continuously scrolling campaign images
 *   3.  NewDropSection       — editorial product grid
 *   4.  CategoryTiles        — shop by category
 *   5.  BestsellersSection   — "THE ONES EVERYONE WANTS."
 *   6.  ShopTheLook          — model image + shoppable product list
 *   7.  BrandStory           — "THE CULTURE" manifesto
 *   8.  TrendingNow          — lookbook / latest drop editorial grid
 *   9.  CommunitySection     — "WORN BY THE CULTURE" UGC grid
 *  10.  TrustBadges          — service trust strip
 */

import type { Metadata } from "next";
import { getHomepageCms } from "@/lib/api";
import { HeroBanner } from "@/components/home/HeroBanner";
import { NewDropSection } from "@/components/home/NewDropSection";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { BestsellersSection } from "@/components/home/BestsellersSection";
import { ShopTheLookSection } from "@/components/home/ShopTheLookSection";
import { BrandStorySection } from "@/components/home/BrandStorySection";
import { TrendingNow } from "@/components/home/TrendingNow";
import { CommunitySection } from "@/components/home/CommunitySection";
import { TrustBadges } from "@/components/home/TrustBadges";

export const metadata: Metadata = {
  title: "NOT MADE TO BLEND IN. | CULTRAVEN — Gen Z Streetwear India",
  description:
    "Shop CULTRAVEN's latest drops — oversized 260 GSM heavyweights, acid-state washes, mythic graphic tees & cargo pants. India's Gen Z streetwear cult. Free delivery above ₹999.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let cmsData = null;
  try {
    cmsData = await getHomepageCms();
  } catch {
    // Graceful fallback — static sections still render
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";

  return (
    <div className="w-full">
      {/* 1 — Full-screen campaign hero
            Negative margin pulls it behind the transparent sticky header.
            Header height ≈ 65px desktop (60px logo outer box + 2×0.15rem padding). */}
      <div style={{ marginTop: "-65px" }}>
        {(cmsData as any)?.heroSlides?.length > 0 ? (
          <HeroBanner slides={(cmsData as any).heroSlides} siteUrl={siteUrl} />
        ) : cmsData?.heroSlide ? (
          <HeroBanner slides={[cmsData.heroSlide]} siteUrl={siteUrl} />
        ) : null}
      </div>

      {/* 2 — New Drop: editorial product grid */}
      <NewDropSection />

      {/* 4 — Shop By Category */}
      <CategoryTiles />

      {/* 5 — Bestsellers */}
      <BestsellersSection />

      {/* 6 — Shop The Look */}
      <ShopTheLookSection />

      {/* 7 — Brand Story */}
      <BrandStorySection />

      {/* 8 — Latest Drop / Lookbook */}
      <TrendingNow />

      {/* 9 — Community / UGC */}
      <CommunitySection />

      {/* 10 — Trust strip */}
      {cmsData?.trustBadges && cmsData.trustBadges.length > 0 && (
        <TrustBadges badges={cmsData.trustBadges} />
      )}
    </div>
  );
}
