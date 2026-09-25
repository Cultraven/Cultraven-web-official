/**
 * CULTRAVEN Storefront — Production Fixtures & Mock Data
 *
 * Modeled after luxury menswear storefront layouts (Louis Philippe reference).
 * Provides rich, high-fidelity default data when microservices are offline.
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
    id: "sale",
    type: "gold-embossed",
    title: "SALE",
    subtitle: "Up to 50% Off",
    href: "/collections/sale",
  },
  {
    id: "new-in",
    type: "gold-embossed",
    title: "NEW IN",
    subtitle: "Autumn/Winter 26",
    href: "/collections/new-in",
  },
  {
    id: "bestsellers",
    type: "gold-embossed",
    title: "BEST SELLERS",
    subtitle: "Top Rated",
    href: "/collections/bestsellers",
  },
  {
    id: "all-styles",
    type: "gold-embossed",
    title: "ALL STYLES",
    subtitle: "Explore Entire Catalog",
    href: "/collections/all",
  },
  {
    id: "pigmentum",
    type: "photo",
    title: "Permapress Pigmentum",
    subtitle: "Non-iron Luxury Shirts",
    imageSrc: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    href: "/collections/pigmentum",
  },
  {
    id: "formals",
    type: "photo",
    title: "Formals",
    subtitle: "Tailored Suits & Blazers",
    imageSrc: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
    href: "/category/formal-shirts",
  },
  {
    id: "casuals",
    type: "photo",
    title: "Casuals",
    subtitle: "Linen, Knits & Chinos",
    imageSrc: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    href: "/category/casual-shirts",
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
    id: "knit-shirt",
    title: "24-Hour Knit Shirt",
    category: "Shirts",
    imageSrc: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
    href: "/product/24-hour-knit-shirt",
    features: [
      { icon: "nylon", label: "NYLON BLEND" },
      { icon: "non-iron", label: "NON-IRON" },
      { icon: "stretch", label: "4-WAY STRETCH" },
    ],
  },
  {
    id: "shacket",
    title: "Shacket Layering",
    category: "Outerwear",
    imageSrc: "https://images.unsplash.com/photo-1523398002811-999aa8e9f5b9?w=800&auto=format&fit=crop&q=80",
    href: "/collections/outerwear",
    features: [
      { icon: "cotton", label: "HEAVY TWILL" },
      { icon: "breathable", label: "BREATHABLE" },
      { icon: "pockets", label: "DUAL POCKETS" },
    ],
  },
  {
    id: "coloured-denim",
    title: "Coloured Denim",
    category: "Bottoms",
    imageSrc: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb1?w=800&auto=format&fit=crop&q=80",
    href: "/category/slim-jeans",
    features: [
      { icon: "selvedge", label: "SELVEDGE" },
      { icon: "comfort", label: "COMFORT FLEX" },
      { icon: "dye", label: "ORGANIC DYE" },
    ],
  },
];

// ─── Pigmentum / Raven Elite Luxury Color Showcase ───────────────────────────

export interface PigmentumProduct {
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

export const PIGMENTUM_COLLECTION: PigmentumProduct[] = [
  {
    id: "pigmentum-purple",
    title: "Imperial Tyrian Dobby Shirt",
    swatchLabel: "TYRIAN PURPLE",
    swatchColor: "#4B1B52",
    bgGradient: "linear-gradient(135deg, #1f0b24 0%, #3a1542 50%, #150719 100%)",
    imageSrc: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
    pricePaise: 349900,
    mrpPaise: 449900,
    fabric: "100% Giza Cotton • 120s 2-Ply",
    href: "/product/imperial-tyrian-dobby-shirt",
  },
  {
    id: "pigmentum-indigo",
    title: "Midnight Mist Oxford Shirt",
    swatchLabel: "MIDNIGHT INDIGO",
    swatchColor: "#182B49",
    bgGradient: "linear-gradient(135deg, #091321 0%, #152640 50%, #08111e 100%)",
    imageSrc: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    pricePaise: 329900,
    mrpPaise: 429900,
    fabric: "Supima Cotton • Wrinkle Free",
    href: "/product/midnight-mist-oxford-shirt",
  },
  {
    id: "pigmentum-gold",
    title: "Ancient Chalk Stripe Shirt",
    swatchLabel: "ANCIENT CHALK",
    swatchColor: "#B59359",
    bgGradient: "linear-gradient(135deg, #261f12 0%, #443720 50%, #1e180d 100%)",
    imageSrc: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    pricePaise: 379900,
    mrpPaise: 499900,
    fabric: "Silk-Linen Blend • Golden Ratio",
    href: "/product/ancient-chalk-stripe-shirt",
  },
  {
    id: "pigmentum-terracotta",
    title: "Terracotta Weave Tailored Shirt",
    swatchLabel: "TERRACOTTA WEAVE",
    swatchColor: "#8D3E32",
    bgGradient: "linear-gradient(135deg, #2a100d 0%, #4a1d17 50%, #1c0a08 100%)",
    imageSrc: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    pricePaise: 349900,
    mrpPaise: 449900,
    fabric: "Long-Staple Compact Weave",
    href: "/product/terracotta-weave-tailored-shirt",
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
    bgColor: "#172545",
    textColor: "#F5F1E8",
  },

  navMenu: {
    items: [
      { id: "new-in", label: "NEW IN", href: "/collections/new-in" },
      { id: "sale", label: "SALE", href: "/collections/sale" },
      {
        id: "shop",
        label: "SHOP",
        columns: [
          {
            heading: "Oversized Tees",
            items: [
              { label: "Essentials.260 Heavyweight", href: "/category/essentials", isNew: true },
              { label: "Acid State Vintage Wash", href: "/category/acid-state", isNew: true },
              { label: "Lava Stripe Sprayed Wash", href: "/category/lava-stripe" },
              { label: "All Oversized Tees", href: "/category/oversized-tees" },
            ],
          },
          {
            heading: "Graphic Series",
            items: [
              { label: "Dharma EP01 — Mythology", href: "/category/dharma", isNew: true },
              { label: "Dragon Blood — Mythic", href: "/category/dragon-blood", isNew: true },
              { label: "All Graphic Tees", href: "/category/graphic-tees" },
            ],
          },
          {
            heading: "Bottoms",
            items: [
              { label: "Cargo Pants", href: "/category/cargo-pants" },
              { label: "Relaxed Fit Jeans", href: "/category/relaxed-jeans" },
              { label: "Joggers", href: "/category/joggers" },
            ],
          },
          {
            heading: "Accessories",
            items: [
              { label: "Caps & Hats", href: "/category/caps" },
              { label: "Tote Bags", href: "/category/totes" },
            ],
          },
        ],
      },
      {
        id: "collections",
        label: "COLLECTIONS",
        columns: [
          {
            heading: "Cult Drops",
            items: [
              { label: "Dharma EP01", href: "/category/dharma", isNew: true },
              { label: "Dragon Blood", href: "/category/dragon-blood", isNew: true },
              { label: "Acid State", href: "/category/acid-state" },
              { label: "Lava Stripe", href: "/category/lava-stripe" },
              { label: "Essentials.260", href: "/category/essentials" },
            ],
          },
        ],
      },
      { id: "about", label: "ABOUT", href: "/pages/our-heritage" },
    ],
  },

  heroSlide: {
    id: "hero-split-campaign",
    type: "image",
    srcDesktop: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=80",
    srcMobile: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    altText: "CULTRAVEN Motorsport & Coastal Riviera Campaign AW26",
    headline: "CULTRAVEN MOTORSPORT",
    subheadline: "High-octane precision tailoring meets coastal Mediterranean ease.",
    ctaLabel: "SHOP NOW",
    ctaHref: "/collections/all",
    textColor: "#FFFFFF",
    overlayOpacity: 0.35,
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
    id: "editorial-autumn-2026",
    imageSrc: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1600&auto=format&fit=crop&q=80",
    imageAlt: "The Sovereign Cut — Cultraven Campaign",
    tagline: "AUTUMN / WINTER 2026",
    headline: "Dressed for the Pursuit. Crafted for the Room.",
    ctaLabel: "EXPLORE THE CAMPAIGN",
    ctaHref: "/collections/autumn-2026",
    textPosition: "center",
    textColor: "#F5F0EB",
  },

  reviewItems: [
    {
      id: "rev-1",
      authorName: "Vikram Singhania",
      rating: 5,
      body: "The 24-Hour Knit Shirt is an absolute revelation. Breathable through a 14-hour workday and looks as sharp in the boardroom as at dinner.",
      productName: "24-Hour Knit Shirt (Mocha)",
      productThumb: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=200&auto=format&fit=crop&q=80",
      productSlug: "24-hour-knit-shirt",
      verifiedPurchase: true,
      publishedAt: "2026-09-18T10:00:00Z",
    },
    {
      id: "rev-2",
      authorName: "Aditya Roy Kapur",
      rating: 5,
      body: "Unrivalled fit. I have worn luxury Savile Row suits, and Cultraven's Permapress Pigmentum shirts stand right shoulder to shoulder.",
      productName: "Imperial Tyrian Dobby Shirt",
      productThumb: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&auto=format&fit=crop&q=80",
      productSlug: "imperial-tyrian-dobby-shirt",
      verifiedPurchase: true,
      publishedAt: "2026-09-14T15:30:00Z",
    },
    {
      id: "rev-3",
      authorName: "Devansh Mehta",
      rating: 5,
      body: "Prompt delivery to Bangalore in 36 hours. The packaging was immaculate with personalized monogram cards. Truly a premium tier experience.",
      productName: "Midnight Mist Oxford Shirt",
      productThumb: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&auto=format&fit=crop&q=80",
      productSlug: "midnight-mist-oxford-shirt",
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
          { label: "New Drops", href: "/collections/new-in" },
          { label: "Cult Favourites", href: "/collections/bestsellers" },
          { label: "Essentials.260", href: "/category/essentials" },
          { label: "Acid State", href: "/category/acid-state" },
          { label: "Dharma EP01", href: "/category/dharma" },
          { label: "Dragon Blood", href: "/category/dragon-blood" },
        ],
      },
      {
        id: "brand",
        heading: "The Cult",
        links: [
          { label: "Our Story", href: "/pages/our-heritage" },
          { label: "Wear Your Difference", href: "/pages/manifesto" },
          { label: "Sustainability", href: "/pages/sustainability" },
          { label: "Lookbook", href: "/collections/lookbook" },
          { label: "Press", href: "/pages/press" },
        ],
      },
      {
        id: "help",
        heading: "Help",
        links: [
          { label: "Track My Order", href: "/account/orders" },
          { label: "Returns & Exchanges", href: "/pages/returns" },
          { label: "Size Guide", href: "/pages/size-guide" },
          { label: "Contact Us", href: "/pages/contact" },
          { label: "FAQs", href: "/pages/faqs" },
        ],
      },
      {
        id: "legal",
        heading: "Legal",
        links: [
          { label: "Privacy Policy", href: "/pages/privacy" },
          { label: "Terms of Service", href: "/pages/terms" },
          { label: "Shipping Policy", href: "/pages/shipping" },
          { label: "Refund Policy", href: "/pages/refunds" },
        ],
      },
    ],
    socialLinks: [
      { platform: "instagram", href: "https://instagram.com/cultraven" },
      { platform: "facebook", href: "https://facebook.com/cultraven" },
      { platform: "twitter", href: "https://twitter.com/cultraven" },
      { platform: "youtube", href: "https://youtube.com/cultraven" },
    ],
    copyrightText: `© ${new Date().getFullYear()} CULTRAVEN — Wear Your Difference.`,
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
      slug: "imperial-tyrian-dobby-shirt",
      title: "Imperial Tyrian Dobby Shirt",
      pricePaise: 349900,
      mrpPaise: 449900,
      image1: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
      badge: "NEW IN",
      isNew: true,
    }),
    makeProductFixture({
      id: "na-2",
      slug: "midnight-mist-oxford-shirt",
      title: "Midnight Mist Oxford Shirt",
      pricePaise: 329900,
      mrpPaise: 429900,
      image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "NEW IN",
      isNew: true,
    }),
    makeProductFixture({
      id: "na-3",
      slug: "ancient-chalk-stripe-shirt",
      title: "Ancient Chalk Stripe Shirt",
      pricePaise: 379900,
      mrpPaise: 499900,
      image1: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      badge: "SIGNATURE",
      isNew: true,
    }),
    makeProductFixture({
      id: "na-4",
      slug: "terracotta-weave-tailored-shirt",
      title: "Terracotta Weave Tailored Shirt",
      pricePaise: 349900,
      mrpPaise: 449900,
      image1: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
      isNew: true,
    }),
  ],

  bestsellers: [
    makeProductFixture({
      id: "bs-1",
      slug: "24-hour-knit-shirt",
      title: "24-Hour Luxury Knit Shirt",
      pricePaise: 299900,
      mrpPaise: 399900,
      image1: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      badge: "BEST SELLER",
      isBest: true,
    }),
    makeProductFixture({
      id: "bs-2",
      slug: "royal-oxford-formal-blazer",
      title: "Royal Navy Travel Blazer",
      pricePaise: 799900,
      mrpPaise: 1099900,
      image1: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
      badge: "BEST SELLER",
      isBest: true,
    }),
    makeProductFixture({
      id: "bs-3",
      slug: "selvedge-coloured-denim-sand",
      title: "Italian Coloured Denim (Sand)",
      pricePaise: 369900,
      mrpPaise: 499900,
      image1: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb1?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "TRENDING",
      isBest: true,
    }),
    makeProductFixture({
      id: "bs-4",
      slug: "safari-shacket-olive",
      title: "Sage Safari Heavy Shacket",
      pricePaise: 449900,
      mrpPaise: 599900,
      image1: "https://images.unsplash.com/photo-1523398002811-999aa8e9f5b9?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
      badge: "ICONIC",
      isBest: true,
    }),
  ],

  categorySpotlight: [
    makeProductFixture({
      id: "cs-1",
      slug: "giza-sateen-formal-shirt-white",
      title: "Sovereign Giza Sateen Shirt (Pure White)",
      pricePaise: 319900,
      mrpPaise: 419900,
      image1: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
      badge: "ESSENTIAL",
    }),
    makeProductFixture({
      id: "cs-2",
      slug: "french-cuff-evening-shirt-black",
      title: "French Cuff Tuxedo Shirt (Midnight Black)",
      pricePaise: 399900,
      mrpPaise: 529900,
      image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
      badge: "BLACK TIE",
    }),
  ],
};

