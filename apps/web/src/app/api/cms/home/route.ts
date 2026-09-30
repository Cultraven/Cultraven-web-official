/**
 * GET /api/cms/home
 *
 * Returns the full homepage CMS payload.
 * In production this proxies to cms-service, which reads from MongoDB (shop_cms).
 * In development, returns a rich static fixture so the storefront renders
 * without needing the full microservice stack running.
 */

import { NextResponse } from "next/server";
import type { HomepageCms } from "@shop/types";

// ─── Development fixture ──────────────────────────────────────────────────────

const FIXTURE: HomepageCms = {
  announcementBar: {
    items: [
      {
        id: "1",
        text: "Free Shipping on orders above ₹999",
        link: "/collections/all",
        linkLabel: "Shop Now",
      },
      {
        id: "2",
        text: "Easy 30-Day Returns — No Questions Asked",
      },
      {
        id: "3",
        text: "New Collection: Autumn Essentials — Now Live",
        link: "/collections/autumn-essentials",
        linkLabel: "Explore",
      },
    ],
    intervalMs: 3500,
    bgColor: "#0A0A0A",
    textColor: "#F5F0EB",
  },

  navMenu: {
    items: [
      {
        id: "new-in",
        label: "NEW",
        href: "/collections/new-in",
      },
      {
        id: "shop",
        label: "SHOP",
        columns: [
          {
            heading: "Categories",
            items: [
              { label: "T-Shirts & Tees", href: "/collections/tees", isNew: true },
              { label: "Hoodies & Sweats", href: "/collections/hoodies" },
              { label: "Shirts", href: "/collections/shirts" },
              { label: "Cargo & Bottoms", href: "/collections/bottoms", isNew: true },
              { label: "Outerwear", href: "/collections/outerwear" },
              { label: "Accessories", href: "/collections/accessories" },
            ],
          },
          {
            heading: "By Fit",
            items: [
              { label: "Oversized", href: "/collections/oversized" },
              { label: "Relaxed Fit", href: "/collections/relaxed" },
              { label: "Boxy", href: "/collections/boxy" },
              { label: "Baggy", href: "/collections/baggy" },
            ],
          },
        ],
      },
      {
        id: "drops",
        label: "DROPS",
        columns: [
          {
            heading: "Collections",
            items: [
              { label: "Dharma // EP01", href: "/collections/dharma", isNew: true },
              { label: "Dragon Blood", href: "/collections/dragon-blood" },
              { label: "Acid State", href: "/collections/acid-state" },
              { label: "Lava Stripe", href: "/collections/lava-stripe" },
              { label: "Core Essentials", href: "/collections/core" },
              { label: "All Collections", href: "/collections" },
            ],
          },
          {
            heading: "Explore",
            items: [
              { label: "Latest Drops", href: "/collections/new-in" },
              { label: "Best Sellers", href: "/collections/bestsellers" },
              { label: "Under ₹1,999", href: "/collections/sale" },
              { label: "Lookbook", href: "/pages/lookbook" },
            ],
          },
        ],
      },
      {
        id: "lookbook",
        label: "LOOKBOOK",
        href: "/pages/lookbook",
      },
      {
        id: "blog",
        label: "BLOG",
        href: "/pages/blog",
      },
      {
        id: "sale",
        label: "SALE",
        href: "/collections/sale",
      },
      {
        id: "about",
        label: "ABOUT",
        href: "/pages/about",
      },
    ],
  },

  heroSlide: {
    id: "hero-aw2026",
    type: "image",
    srcDesktop: "/images/hero-desktop.jpg",
    srcMobile: "/images/hero-mobile.jpg",
    altText: "Man wearing Cultraven Autumn Essentials — charcoal blazer and linen trousers",
    headline: "Dressed for the\nPursuit.",
    subheadline: "The Autumn/Winter 2026 collection — understated luxury, built to last.",
    ctaLabel: "Shop the Collection",
    ctaHref: "/collections/autumn-2026",
    textColor: "#F5F0EB",
    overlayOpacity: 0.35,
  },

  trustBadges: [
    { id: "t1", icon: "shipping", title: "Free Shipping", subtitle: "On orders above ₹999" },
    { id: "t2", icon: "returns", title: "Easy Returns", subtitle: "30-day hassle-free" },
    { id: "t3", icon: "secure", title: "Secure Payments", subtitle: "256-bit SSL encrypted" },
    { id: "t4", icon: "cod", title: "COD Available", subtitle: "Pay on delivery" },
  ],

  productRails: [
    {
      id: "rail-new",
      railType: "new-arrivals",
      title: "New Arrivals",
      subtitle: "Fresh styles, just landed",
      viewAllHref: "/collections/new-in",
      limit: 10,
    },
    {
      id: "rail-best",
      railType: "bestsellers",
      title: "Bestsellers",
      subtitle: "Customer favourites",
      viewAllHref: "/collections/bestsellers",
      limit: 10,
    },
    {
      id: "rail-shirts",
      railType: "category-spotlight",
      title: "Shirts",
      subtitle: "The Cultraven shirt — where precision meets personality",
      viewAllHref: "/category/shirts",
      limit: 8,
      categoryId: "shirts",
    },
  ],

  editorialBanner: {
    id: "editorial-1",
    imageSrc: "/images/editorial-banner.jpg",
    imageAlt: "Model in Cultraven slim-fit chinos and Oxford shirt in a heritage setting",
    tagline: "The Cultraven Identity",
    headline: "Refined. Relentless.\nUncompromising.",
    ctaLabel: "Explore the World of Cultraven",
    ctaHref: "/about",
    textPosition: "left",
    textColor: "#F5F0EB",
  },

  reviewItems: [
    {
      id: "r1",
      authorName: "Arjun Mehta",
      rating: 5,
      body: "The Oxford shirt is exceptional — fabric quality, stitching, fit. I've worn it to three board meetings and received compliments every time.",
      productName: "Classic Oxford Shirt — Navy",
      productThumb: "/images/products/oxford-shirt-thumb.jpg",
      productSlug: "classic-oxford-shirt-navy",
      verifiedPurchase: true,
      publishedAt: "2026-09-10",
    },
    {
      id: "r2",
      authorName: "Karan Bose",
      rating: 5,
      body: "The slim-fit blazer fits perfectly out of the box. It's the kind of piece you keep for years.",
      productName: "Slim-Fit Blazer — Charcoal",
      productThumb: "/images/products/blazer-charcoal-thumb.jpg",
      productSlug: "slim-fit-blazer-charcoal",
      verifiedPurchase: true,
      publishedAt: "2026-09-05",
    },
    {
      id: "r3",
      authorName: "Rohan Sharma",
      rating: 4,
      body: "Great quality chinos. The earth tone palette is exactly what I was looking for. Would love more colour options.",
      productName: "Slim Chinos — Khaki",
      productThumb: "/images/products/chinos-khaki-thumb.jpg",
      productSlug: "slim-chinos-khaki",
      verifiedPurchase: true,
      publishedAt: "2026-08-28",
    },
    {
      id: "r4",
      authorName: "Vikram Nair",
      rating: 5,
      body: "Polo tee quality is superb. The fabric has a premium feel and doesn't lose shape after washing.",
      productName: "Classic Polo — Off White",
      productThumb: "/images/products/polo-offwhite-thumb.jpg",
      productSlug: "classic-polo-off-white",
      verifiedPurchase: true,
      publishedAt: "2026-08-20",
    },
    {
      id: "r5",
      authorName: "Sameer Kulkarni",
      rating: 5,
      body: "I ordered the linen shirt for a summer wedding. It was the best-dressed I've felt. Worth every rupee.",
      productName: "Italian Linen Shirt — Stone",
      productThumb: "/images/products/linen-shirt-stone-thumb.jpg",
      productSlug: "italian-linen-shirt-stone",
      verifiedPurchase: true,
      publishedAt: "2026-08-15",
    },
  ],

  newsletter: {
    headline: "Join the Culture.",
    subtext:
      "Get first access to new drops, limited releases and stories from CULTRAVEN.",
    ctaLabel: "Subscribe",
    placeholder: "Your email address",
  },

  footer: {
    columns: [
      {
        id: "shop",
        heading: "Shop",
        links: [
          { label: "New Arrivals", href: "/collections/new-in" },
          { label: "T-Shirts", href: "/category/" },
          { label: "Shirts", href: "/category/" },
          { label: "Hoodies", href: "/category/" },
          { label: "Cargos", href: "/category/" },
          { label: "Jeans", href: "/category/" },
          { label: "Collections", href: "/collections" },
          { label: "Sale", href: "/sale" },
        ],
      },
      {
        id: "help",
        heading: "Help",
        links: [
          { label: "Contact", href: "/contact" },
          { label: "Shipping", href: "/shipping" },
          { label: "Returns", href: "/returns" },
          { label: "Size Guide", href: "/size-guide" },
          { label: "FAQ", href: "/faq" },
          { label: "Track Order", href: "/account/orders" },
        ],
      },
      {
        id: "about",
        heading: "Explore",
        links: [
          { label: "Our Story", href: "/pages/about" },
          { label: "Blog", href: "/pages/blog" },
          { label: "Lookbook", href: "/pages/lookbook" },
          { label: "The Culture Files", href: "/pages/blog" },
          { label: "Careers", href: "/pages/careers" },
          { label: "Wholesale", href: "/pages/wholesale" },
        ],
      },
      {
        id: "legal",
        heading: "Legal",
        links: [
          { label: "Privacy Policy", href: "/pages/privacy" },
          { label: "Terms & Conditions", href: "/pages/terms" },
          { label: "Refund Policy", href: "/pages/returns" },
          { label: "Shipping Policy", href: "/pages/shipping" },
          { label: "Cookie Policy", href: "/pages/cookies" },
        ],
      },
    ],
    socialLinks: [
      { platform: "instagram", href: "https://www.instagram.com/cultraven" },
      { platform: "twitter", href: "https://twitter.com/cultraven" },
      { platform: "youtube", href: "https://www.youtube.com/@cultraven" },
      { platform: "facebook", href: "https://www.facebook.com/cultraven" },
    ],
    copyrightText: `© ${new Date().getFullYear()} CULTRAVEN. All rights reserved.`,
    badgeLogos: [],
  },
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // Return fixture in development — no cms-service required
    return NextResponse.json(FIXTURE);
  }

  // Production: proxy to cms-service
  try {
    const serviceUrl =
      process.env.CMS_SERVICE_URL ?? "http://localhost:4005/api/v1";
    const res = await fetch(`${serviceUrl}/cms/home`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });
    if (!res.ok) throw new Error(`cms-service error ${res.status}`);
    const data = (await res.json()) as HomepageCms;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/cms/home]", err);
    // Fallback to fixture if service is unreachable
    return NextResponse.json(FIXTURE, { status: 200 });
  }
}
