/**
 * Homepage — CULTRAVEN storefront.
 *
 * Every section is loaded from MongoDB on the server (lib/cms/server.ts).
 * A section with no record, or a failed database read (logged server-side),
 * renders nothing — no content is ever fabricated.
 *
 *   1.  HeroBanner (hero slides)        6.  BrandStory
 *   2.  NewDrop (products flagged new)  7.  TrendingNow
 *   3.  CategoryTiles                   8.  PromoBanners (scheduled)
 *   4.  Bestsellers                     9.  Community
 *   5.  ShopTheLook                    10.  TrustBadges
 */
import type { Metadata } from "next";
import { getCmsSection, getHeroSlides, getProducts, getShopLook } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";
import { HeroBanner } from "@/components/home/HeroBanner";
import { NewDropSection } from "@/components/home/NewDropSection";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { BestsellersSection } from "@/components/home/BestsellersSection";
import { ShopTheLookSection } from "@/components/home/ShopTheLookSection";
import { BrandStorySection } from "@/components/home/BrandStorySection";
import { TrendingNow } from "@/components/home/TrendingNow";
import { CommunitySection } from "@/components/home/CommunitySection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { EditorialBanner } from "@/components/home/EditorialBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NOT MADE TO BLEND IN. | CULTRAVEN — Gen Z Streetwear India",
  description:
    "Shop CULTRAVEN's latest drops — oversized 260 GSM heavyweights, acid-state washes, mythic graphic tees & cargo pants. India's Gen Z streetwear cult. Free delivery above ₹999.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [hero, strip, tiles, newDropCopy, newDrops, bestCopy, bestsellers, look, story, trending, promo, community, trust] =
    await Promise.all([
      getHeroSlides(),
      getCmsSection<any>("home.categoryStrip"),
      getCmsSection<any>("home.categoryTiles"),
      getCmsSection<any>("home.newDrop"),
      getProducts("isNewArrival", 4),
      getCmsSection<any>("home.bestsellers"),
      getProducts("isBestseller", 6),
      getShopLook(),
      getCmsSection<any>("home.brandStory"),
      getCmsSection<any>("home.trending"),
      getCmsSection<any>("home.promoBanner"),
      getCmsSection<any>("home.community"),
      getCmsSection<any>("site.trustBadges"),
    ]);

  const heroSlides = (hero.data ?? []).map((b: any) => ({
    id: b.id,
    type: b.type,
    srcDesktop: b.srcDesktop,
    srcMobile: b.srcMobile || "",
    posterSrc: b.posterSrc || "",
    altText: b.altText || "",
    eyebrow: b.eyebrow || "",
    objectPosition: b.objectPosition || "center center",
    durationMs: b.durationMs ?? 5000,
    headline: b.headline || "",
    subheadline: b.subheadline || "",
    ctaLabel: b.ctaLabel || "",
    ctaHref: b.ctaHref || "/collections/all",
    textColor: "#FFFFFF",
    overlayOpacity: b.overlayOpacity ?? 0.45,
  }));

  const stripItems = liveItems<any>(strip.data?.items).map((i) => ({ id: i.id, label: i.label, href: i.href, accent: i.accent }));
  const tileItems = liveItems<any>(tiles.data?.items).map((i) => ({ id: i.id, title: i.title, sub: i.sub, href: i.href, image: i.image, size: i.size }));

  const dropProducts = (newDrops.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    href: p.href,
    image: p.image,
    hoverImage: p.hoverImage,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    rating: p.rating,
    reviewCount: p.reviewCount,
    colors: p.colors,
    sizes: p.sizes,
    sizeOptions: p.sizeOptions,
    isNew: true,
    inStock: p.inStock,
    badge: p.badge,
  }));

  const bestProducts = (bestsellers.data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    href: p.href,
    image: p.image,
    hoverImage: p.hoverImage,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    rating: p.rating,
    reviewCount: p.reviewCount,
    colors: p.colors,
    sizes: p.sizes,
    sizeOptions: p.sizeOptions,
    inStock: p.inStock,
    badge: p.badge === "BESTSELLER" || p.badge === "LOW STOCK" ? (p.badge as "BESTSELLER" | "LOW STOCK") : undefined,
  }));

  const trendItems = liveItems<any>(trending.data?.items).map((i) => ({ id: i.id, title: i.title, href: i.href, image: i.image, alt: i.alt }));
  const ugcImages = liveItems<any>(community.data?.items).map((i) => ({ id: i.id, src: i.image, alt: i.alt || "" }));
  const banners = liveItems<any>(promo.data?.items);
  const badges = liveItems<any>(trust.data?.items).map((b) => ({ id: b.id, icon: b.icon, title: b.title, subtitle: b.subtitle || undefined }));

  return (
    <div className="w-full">
      {/* 1 — Hero. Negative margin tucks it behind the transparent header (≈65px on desktop). */}
      {heroSlides.length > 0 ? (
        <div style={{ marginTop: "-65px" }}>
          <HeroBanner slides={heroSlides as any} />
        </div>
      ) : null}

      {/* 2 — New Drop */}
      {newDropCopy.data ? <NewDropSection content={newDropCopy.data} products={dropProducts} /> : null}

      {/* 3 — Shop by category */}
      {tileItems.length > 0 ? <CategoryTiles strip={stripItems} tiles={tileItems} /> : null}

      {/* 4 — Bestsellers */}
      {bestCopy.data ? <BestsellersSection content={bestCopy.data} products={bestProducts} /> : null}

      {/* 5 — Shop The Look */}
      <ShopTheLookSection look={look.data} />

      {/* 6 — Brand Story */}
      {story.data ? <BrandStorySection content={story.data} /> : null}

      {/* 7 — Trending Now */}
      <TrendingNow heading={trending.data?.heading} items={trendItems} />

      {/* 8 — Promotional banners (only while active and inside their schedule) */}
      {banners.map((b) => (
        <EditorialBanner
          key={b.id}
          banner={{
            id: b.id,
            imageSrc: b.image,
            imageAlt: b.alt || b.headline,
            tagline: b.tagline || "",
            headline: b.headline,
            ctaLabel: b.ctaLabel || "",
            ctaHref: b.ctaHref || "/collections/all",
            textPosition: b.textPosition || "center",
            textColor: "#EDE3CF",
          }}
        />
      ))}

      {/* 9 — Community / UGC */}
      {community.data ? <CommunitySection content={community.data} images={ugcImages} /> : null}

      {/* 10 — Trust strip */}
      {badges.length > 0 ? <TrustBadges badges={badges as any} /> : null}
    </div>
  );
}
