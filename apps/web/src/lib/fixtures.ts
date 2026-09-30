/**
 * CULTRAVEN Storefront — Production Fixtures & Mock Data
 *
 * Gen-Z Indian streetwear brand. Product taxonomy per Metlink research (Sep 2026):
 * oversized tees, hoodies, cargo pants, baggy jeans, co-ords, varsity jackets.
 * Fallback data when DB / microservices are offline.
 */

import type { HomepageCms, Product } from "@shop/types";

// ─── Category Shortcut Tiles (Gold 3D Embossed + Photo Cards) ───────────────

export interface CategoryTile {
  id: string;
  type: "gold-embossed" | "photo";
  title: string;
  subtitle?: string;
  imageSrc?: string;
  href: string;
  badge?: string;
}

export const CATEGORY_TILES: CategoryTile[] = [
  {
    id: "new-in",
    type: "gold-embossed",
    title: "NEW DROP",
    subtitle: "Just Landed",
    href: "/collections/new-in",
    badge: "LIVE",
  },
  {
    id: "tees",
    type: "photo",
    title: "Oversized Tees",
    subtitle: "260 GSM Heavyweight Cotton",
    imageSrc: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    href: "/collections/tees",
  },
  {
    id: "hoodies",
    type: "photo",
    title: "Hoodies & Sweats",
    subtitle: "Oversized · Graphic · Heavy",
    imageSrc: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    href: "/collections/hoodies",
  },
  {
    id: "bottoms",
    type: "photo",
    title: "Cargo & Bottoms",
    subtitle: "Baggy · Cargo · Wide-Leg",
    imageSrc: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
    href: "/collections/bottoms",
  },
  {
    id: "sale",
    type: "gold-embossed",
    title: "SALE",
    subtitle: "Up to 50% Off",
    href: "/collections/sale",
  },
  {
    id: "bestsellers",
    type: "gold-embossed",
    title: "CULT PICKS",
    subtitle: "Community Favourites",
    href: "/collections/bestsellers",
  },
  {
    id: "all",
    type: "gold-embossed",
    title: "ALL STYLES",
    subtitle: "Browse Everything",
    href: "/collections/all",
  },
];

// ─── Trending Now Feature Items ──────────────────────────────────────────────

export interface TrendingItem {
  id: string;
  title: string;
  category: string;
  imageSrc: string;
  href: string;
  features: {
    icon: string;
    label: string;
  }[];
}

export const TRENDING_NOW_ITEMS: TrendingItem[] = [
  {
    id: "dragon-blood-tee",
    title: "Dragon Blood Graphic Tee",
    category: "Oversized Tees",
    imageSrc: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
    href: "/products/dragon-blood-graphic-tee",
    features: [
      { icon: "cotton", label: "260 GSM COTTON" },
      { icon: "print", label: "SCREEN PRINT" },
      { icon: "fit", label: "OVERSIZED FIT" },
    ],
  },
  {
    id: "dharma-hoodie",
    title: "Dharma EP01 Graphic Hoodie",
    category: "Hoodies",
    imageSrc: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80",
    href: "/products/dharma-ep01-hoodie",
    features: [
      { icon: "cotton", label: "420 GSM FLEECE" },
      { icon: "fit", label: "OVERSIZED DROP" },
      { icon: "graphic", label: "MYTHIC PRINT" },
    ],
  },
  {
    id: "raven-cargo",
    title: "Raven Multi-Pocket Cargo",
    category: "Cargo Pants",
    imageSrc: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80",
    href: "/products/raven-cargo-pants",
    features: [
      { icon: "pockets", label: "6 POCKETS" },
      { icon: "fit", label: "BAGGY FIT" },
      { icon: "fabric", label: "TWILL WEAVE" },
    ],
  },
];

// ─── Dharma Collection — Signature Cultural Series ───────────────────────────

export interface DharmaProduct {
  id: string;
  title: string;
  swatchLabel: string;
  swatchColor: string;
  bgGradient: string;
  imageSrc: string;
  pricePaise: number;
  mrpPaise: number;
  fabric: string;
  href: string;
}

export const DHARMA_COLLECTION: DharmaProduct[] = [
  {
    id: "dharma-raven-black",
    title: "Raven Mythology Oversized Tee",
    swatchLabel: "RAVEN BLACK",
    swatchColor: "#1A1A1A",
    bgGradient: "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 50%, #080808 100%)",
    imageSrc: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    pricePaise: 189900,
    mrpPaise: 249900,
    fabric: "260 GSM Combed Cotton • Drop Shoulder",
    href: "/products/raven-mythology-oversized-tee",
  },
  {
    id: "dharma-storm-grey",
    title: "Storm Chakra Graphic Tee",
    swatchLabel: "STORM GREY",
    swatchColor: "#3A3A3A",
    bgGradient: "linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 50%, #141414 100%)",
    imageSrc: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
    pricePaise: 179900,
    mrpPaise: 229900,
    fabric: "260 GSM Heavyweight • Back Print",
    href: "/products/storm-chakra-graphic-tee",
  },
  {
    id: "dharma-bone",
    title: "Dharma Symbols Washed Tee",
    swatchLabel: "VINTAGE BONE",
    swatchColor: "#EDE3CF",
    bgGradient: "linear-gradient(135deg, #c4ba9e 0%, #ede3cf 50%, #b8ae94 100%)",
    imageSrc: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
    pricePaise: 189900,
    mrpPaise: 249900,
    fabric: "260 GSM • Acid Wash Finish",
    href: "/products/dharma-symbols-washed-tee",
  },
  {
    id: "dharma-navy",
    title: "Cult Navy Heavyweight Tee",
    swatchLabel: "DEEP NAVY",
    swatchColor: "#172554",
    bgGradient: "linear-gradient(135deg, #0e1a3a 0%, #1e3060 50%, #0a1228 100%)",
    imageSrc: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    pricePaise: 199900,
    mrpPaise: 259900,
    fabric: "280 GSM Combed Cotton • Puff Print",
    href: "/products/cult-navy-heavyweight-tee",
  },
];

// ─── Full Homepage CMS Fixture ───────────────────────────────────────────────

export const HOMEPAGE_CMS_FIXTURE: HomepageCms = {
  announcementBar: {
    items: [
      {
        id: "1",
        text: "New drop: DRAGON BLOOD by CULTRAVEN — Limited units. Use code: RAVEN10 for 10% off your first order.",
        link: "/category/dragon-blood",
        linkLabel: "Shop Now",
      },
      {
        id: "2",
        text: "Free express delivery on all orders above ₹999 — Pan India. No code needed.",
        link: "/collections/new-in",
        linkLabel: "Shop New Arrivals",
      },
      {
        id: "3",
        text: "DHARMA EP01 is live — Original Indian mythological screen-prints on 250 GSM cotton.",
        link: "/category/dharma",
        linkLabel: "Explore Dharma",
      },
    ],
    intervalMs: 4000,
    bgColor: "var(--color-navy)",
    textColor: "var(--color-cream)",
  },

  navMenu: {
    items: [
      { id: "new", label: "New", href: "/collections/new" },
      {
        id: "shop",
        label: "Shop",
        columns: [
          {
            heading: "Categories",
            items: [
              { label: "Tees", href: "/collections/tees" },
              { label: "Hoodies & Sweats", href: "/collections/hoodies-sweats" },
              { label: "Shirts", href: "/collections/shirts" },
              { label: "Bottoms", href: "/collections/bottoms" },
              { label: "Outerwear", href: "/collections/outerwear" },
              { label: "Accessories", href: "/collections/accessories" },
            ],
          },
          {
            heading: "Featured",
            items: [
              { label: "Sale", href: "/collections/sale" },
              { label: "Essentials.260", href: "/collections/essentials" },
            ],
          },
        ],
      },
      { id: "drops", label: "Drops", href: "/collections/drops" },
      { id: "about", label: "About", href: "/pages/about" },
    ],
  },

  heroSlide: {
    id: "hero-dharma-aw26",
    type: "image",
    srcDesktop: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=80",
    srcMobile: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    altText: "CULTRAVEN DHARMA Collection — Gen-Z Streetwear India",
    headline: "WEAR YOUR DIFFERENCE.",
    subheadline: "DHARMA EP01 — 260 GSM heavyweight cotton. Mythic screen-prints. Built for those who create their own identity.",
    ctaLabel: "SHOP THE DROP",
    ctaHref: "/collections/new-in",
    textColor: "#EDE3CF",
    overlayOpacity: 0.45,
  },

  trustBadges: [
    { id: "t1", icon: "shipping", title: "Free Delivery ₹999+", subtitle: "Pan-India express dispatch" },
    { id: "t2", icon: "returns", title: "Easy 7-Day Returns", subtitle: "No questions asked" },
    { id: "t3", icon: "secure", title: "100% Secure Checkout", subtitle: "UPI · Cards · Net Banking" },
    { id: "t4", icon: "cod", title: "Cash On Delivery", subtitle: "Available across India" },
  ],

  productRails: [
    {
      id: "rail-new",
      railType: "new-arrivals",
      title: "Fresh Drops",
      subtitle: "Just landed — oversized heavyweights, acid washes & mythic graphics",
      viewAllHref: "/collections/new-in",
      limit: 8,
    },
    {
      id: "rail-best",
      railType: "bestsellers",
      title: "Cult Favourites",
      subtitle: "Pieces the community keeps coming back to — ranked by the cult",
      viewAllHref: "/collections/bestsellers",
      limit: 8,
    },
    {
      id: "rail-spotlight",
      railType: "category-spotlight",
      title: "The Heavyweight Edit",
      subtitle: "260 GSM combed cotton. Built to last. Built to be noticed.",
      viewAllHref: "/category/essentials",
      limit: 8,
      categoryId: "essentials",
    },
  ],

  editorialBanner: {
    id: "editorial-dharma-2026",
    imageSrc: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600&auto=format&fit=crop&q=80",
    imageAlt: "CULTRAVEN DHARMA Collection — Indian Mythology Streetwear",
    tagline: "DHARMA SERIES · EP 01",
    headline: "Not For The Crowd. For The Cult.",
    ctaLabel: "EXPLORE THE SERIES",
    ctaHref: "/collections/dharma",
    textPosition: "center",
    textColor: "#EDE3CF",
  },

  reviewItems: [
    {
      id: "rev-1",
      authorName: "Arjun K.",
      rating: 5,
      body: "Dragon Blood tee is insane. The 260 GSM cotton feels premium, the graphic is clean, and the oversized fit is exactly right. Gets compliments every time.",
      productName: "Dragon Blood Graphic Tee (Raven Black)",
      productThumb: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80",
      productSlug: "dragon-blood-graphic-tee",
      verifiedPurchase: true,
      publishedAt: "2026-09-18T10:00:00Z",
    },
    {
      id: "rev-2",
      authorName: "Priya S.",
      rating: 5,
      body: "The Dharma hoodie is so cozy and heavy — nothing like those thin hoodies you get everywhere. Washed 4 times, print still looks fire. 100% worth it.",
      productName: "Dharma EP01 Graphic Hoodie",
      productThumb: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&auto=format&fit=crop&q=80",
      productSlug: "dharma-ep01-hoodie",
      verifiedPurchase: true,
      publishedAt: "2026-09-14T15:30:00Z",
    },
    {
      id: "rev-3",
      authorName: "Rohan M.",
      rating: 5,
      body: "Delivered to Pune in 2 days. Packaging was minimal and clean. The Raven Cargo pants are baggy in the right places, super comfortable. Already ordered 2 more.",
      productName: "Raven Multi-Pocket Cargo (Khaki)",
      productThumb: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&auto=format&fit=crop&q=80",
      productSlug: "raven-cargo-pants",
      verifiedPurchase: true,
      publishedAt: "2026-09-10T12:00:00Z",
    },
  ],

  newsletter: {
    headline: "Join The Cult.",
    subtext: "Get early access to limited drops, ₹500 off your first order, and exclusive CULTRAVEN member content. No spam — only the drops that matter.",
    ctaLabel: "JOIN NOW",
    placeholder: "Enter your email address",
  },

  footer: {
    columns: [
      {
        id: "shop",
        heading: "Shop",
        links: [
          { label: "Tees", href: "/collections/tees" },
          { label: "Hoodies & Sweats", href: "/collections/hoodies-sweats" },
          { label: "Shirts", href: "/collections/shirts" },
          { label: "Bottoms", href: "/collections/bottoms" },
          { label: "Outerwear", href: "/collections/outerwear" },
          { label: "Accessories", href: "/collections/accessories" },
        ],
      },
      {
        id: "help",
        heading: "Support",
        links: [
          { label: "Track Order", href: "/account/orders" },
          { label: "Shipping", href: "/pages/shipping" },
          { label: "Returns", href: "/pages/returns" },
          { label: "Size Guide", href: "/pages/size-guide" },
          { label: "FAQ", href: "/pages/faqs" },
          { label: "Contact", href: "/pages/contact" },
        ],
      },
      {
        id: "brand",
        heading: "Brand",
        links: [
          { label: "About", href: "/pages/about" },
          { label: "Lore", href: "/pages/lore" },
        ],
      },
    ],
    socialLinks: [
      { platform: "instagram", href: "https://instagram.com/cultraven" },
      { platform: "youtube", href: "https://youtube.com/cultraven" },
    ],
    copyrightText: `© ${new Date().getFullYear()} CULTRAVEN.`,
    badgeLogos: [],
  },
};

// ─── Featured Products Fixture ───────────────────────────────────────────────

function makeProductFixture(data: {
  id: string;
  slug: string;
  title: string;
  pricePaise: number;
  mrpPaise: number;
  image1: string;
  image2: string;
  badge?: string;
  isNew?: boolean;
  isBest?: boolean;
}): Product {
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: "260 GSM heavyweight cotton built for the streets. Oversized fit, pre-washed texture, and screen-print graphics made for those who create their own identity.",
    categoryIds: ["oversized-tees"],
    images: [data.image1, data.image2],
    status: "active",
    isNewArrival: data.isNew ?? false,
    isBestseller: data.isBest ?? false,
    isFeatured: true,
    variants: [
      { sku: `${data.id}-38`, size: "38", color: "Classic", pricePaise: data.pricePaise, mrpPaise: data.mrpPaise, stock: 25 },
      { sku: `${data.id}-40`, size: "40", color: "Classic", pricePaise: data.pricePaise, mrpPaise: data.mrpPaise, stock: 30 },
      { sku: `${data.id}-42`, size: "42", color: "Classic", pricePaise: data.pricePaise, mrpPaise: data.mrpPaise, stock: 20 },
      { sku: `${data.id}-44`, size: "44", color: "Classic", pricePaise: data.pricePaise, mrpPaise: data.mrpPaise, stock: 15 },
    ],
  };
}

export const FEATURED_PRODUCTS_FIXTURE = {
  newArrivals: [
    makeProductFixture({
      id: "na-1",
      slug: "dragon-blood-graphic-tee",
      title: "Dragon Blood Graphic Tee",
      pricePaise: 189900,
      mrpPaise: 249900,
      image1: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "NEW DROP",
      isNew: true,
    }),
    makeProductFixture({
      id: "na-2",
      slug: "dharma-ep01-hoodie",
      title: "Dharma EP01 Graphic Hoodie",
      pricePaise: 299900,
      mrpPaise: 399900,
      image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "NEW DROP",
      isNew: true,
    }),
    makeProductFixture({
      id: "na-3",
      slug: "raven-cargo-pants",
      title: "Raven Multi-Pocket Cargo",
      pricePaise: 249900,
      mrpPaise: 329900,
      image1: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
      badge: "NEW IN",
      isNew: true,
    }),
    makeProductFixture({
      id: "na-4",
      slug: "cult-wide-leg-jeans",
      title: "Cult Wide-Leg Baggy Jeans",
      pricePaise: 279900,
      mrpPaise: 359900,
      image1: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      badge: "NEW IN",
      isNew: true,
    }),
  ],

  bestsellers: [
    makeProductFixture({
      id: "bs-1",
      slug: "raven-mythology-oversized-tee",
      title: "Raven Mythology Oversized Tee",
      pricePaise: 189900,
      mrpPaise: 249900,
      image1: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
      badge: "CULT PICK",
      isBest: true,
    }),
    makeProductFixture({
      id: "bs-2",
      slug: "dharma-ep01-hoodie",
      title: "Dharma EP01 Graphic Hoodie",
      pricePaise: 299900,
      mrpPaise: 399900,
      image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "BEST SELLER",
      isBest: true,
    }),
    makeProductFixture({
      id: "bs-3",
      slug: "raven-cargo-pants",
      title: "Raven Multi-Pocket Cargo",
      pricePaise: 249900,
      mrpPaise: 329900,
      image1: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
      badge: "TRENDING",
      isBest: true,
    }),
    makeProductFixture({
      id: "bs-4",
      slug: "cult-wide-leg-jeans",
      title: "Cult Wide-Leg Baggy Jeans",
      pricePaise: 279900,
      mrpPaise: 359900,
      image1: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      badge: "ICONIC",
      isBest: true,
    }),
  ],

  categorySpotlight: [
    makeProductFixture({
      id: "cs-1",
      slug: "storm-chakra-graphic-tee",
      title: "Storm Chakra Graphic Tee",
      pricePaise: 179900,
      mrpPaise: 229900,
      image1: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
      badge: "HEAVYWEIGHT",
    }),
    makeProductFixture({
      id: "cs-2",
      slug: "cult-navy-heavyweight-tee",
      title: "Cult Navy Heavyweight Tee",
      pricePaise: 199900,
      mrpPaise: 259900,
      image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "280 GSM",
    }),
  ],
};

