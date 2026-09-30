/**
 * Database seed — `pnpm db:seed` (from repo root) or `pnpm --filter @shop/web db:seed`.
 *
 * Creates the INITIAL content records the storefront needs. After seeding, both the
 * Admin Panel and the public website read these records from MongoDB. No component
 * imports this file.
 *
 * Safe to run repeatedly: every record is inserted only if it does not exist yet
 * ($setOnInsert / "only if empty"), so admin edits are never overwritten.
 *   --force   overwrite existing CMS sections + reseed hero / shop-the-look
 *             (products are never overwritten)
 *   --dry-run print what would be written, touch nothing
 */
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
for (const file of [path.join(here, "../.env"), path.join(here, "../.env.local")]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=85`;

// ─── CMS sections ────────────────────────────────────────────────────────────

const withIds = (prefix, items) => items.map((it, i) => ({ id: `${prefix}-${i + 1}`, ...it }));

const SECTIONS = {
  "site.announcement": {
    intervalMs: 4000,
    items: withIds("ann", [
      { text: "ACID STATE DROP IS LIVE", link: "", active: true },
      { text: "FREE SHIPPING ABOVE ₹1,999", link: "", active: true },
      { text: "CASH ON DELIVERY AVAILABLE", link: "", active: true },
      { text: "EASY 7-DAY RETURNS", link: "", active: true },
    ]),
  },
  "site.nav": {
    items: withIds("nav", [
      { label: "NEW", href: "/collections/new-in", columns: [], active: true },
      {
        label: "SHOP", href: "", active: true,
        columns: withIds("navcol-shop", [
          { heading: "Categories", items: withIds("navlink-cat", [
            { label: "T-Shirts & Tees", href: "/collections/tees", isNew: true },
            { label: "Hoodies & Sweats", href: "/collections/hoodies", isNew: false },
            { label: "Shirts", href: "/collections/shirts", isNew: false },
            { label: "Cargo & Bottoms", href: "/collections/bottoms", isNew: true },
            { label: "Outerwear", href: "/collections/outerwear", isNew: false },
            { label: "Accessories", href: "/collections/accessories", isNew: false },
          ]) },
          { heading: "By Fit", items: withIds("navlink-fit", [
            { label: "Oversized", href: "/collections/oversized", isNew: false },
            { label: "Relaxed Fit", href: "/collections/relaxed", isNew: false },
            { label: "Boxy", href: "/collections/boxy", isNew: false },
            { label: "Baggy", href: "/collections/baggy", isNew: false },
          ]) },
        ]),
      },
      {
        label: "DROPS", href: "", active: true,
        columns: withIds("navcol-drops", [
          { heading: "Collections", items: withIds("navlink-col", [
            { label: "Dharma // EP01", href: "/collections/dharma", isNew: true },
            { label: "Dragon Blood", href: "/collections/dragon-blood", isNew: false },
            { label: "Acid State", href: "/collections/acid-state", isNew: false },
            { label: "Lava Stripe", href: "/collections/lava-stripe", isNew: false },
            { label: "Core Essentials", href: "/collections/core", isNew: false },
            { label: "All Collections", href: "/collections", isNew: false },
          ]) },
          { heading: "Explore", items: withIds("navlink-exp", [
            { label: "Best Sellers", href: "/collections/bestsellers", isNew: false },
            { label: "Under ₹1,999", href: "/collections/sale", isNew: false },
            { label: "Lookbook", href: "/pages/lookbook", isNew: false },
            { label: "The Culture Files (Blog)", href: "/pages/journal", isNew: false },
          ]) },
        ]),
      },
      { label: "SALE", href: "/collections/sale", columns: [], active: true },
      { label: "ABOUT", href: "/pages/our-heritage", columns: [], active: true },
    ]),
  },
  "site.footer": {
    copyrightText: `© ${new Date().getFullYear()} CULTRAVEN.`,
    columns: withIds("fcol", [
      { heading: "Shop", links: withIds("flink-shop", [
        { label: "New Arrivals", href: "/collections/new-in", openInNew: false },
        { label: "Oversized Tees", href: "/collections/tees", openInNew: false },
        { label: "Hoodies", href: "/collections/hoodies", openInNew: false },
        { label: "Cargo & Bottoms", href: "/collections/bottoms", openInNew: false },
        { label: "Accessories", href: "/collections/accessories", openInNew: false },
        { label: "Sale", href: "/collections/sale", openInNew: false },
      ]) },
      { heading: "Support", links: withIds("flink-sup", [
        { label: "Contact Us", href: "/pages/contact", openInNew: false },
        { label: "Track Order", href: "/pages/track-order", openInNew: false },
        { label: "Shipping Policy", href: "/pages/shipping", openInNew: false },
        { label: "Return Policy", href: "/pages/returns", openInNew: false },
        { label: "Terms & Conditions", href: "/pages/terms", openInNew: false },
        { label: "Privacy Policy", href: "/pages/privacy", openInNew: false },
        { label: "FAQ", href: "/pages/faq", openInNew: false },
      ]) },
      { heading: "The Cult", links: withIds("flink-brand", [
        { label: "Our Heritage", href: "/pages/our-heritage", openInNew: false },
        { label: "Journal", href: "/pages/journal", openInNew: false },
        { label: "Size Guide", href: "/pages/size-guide", openInNew: false },
        { label: "Contact", href: "/pages/contact", openInNew: false },
      ]) },
    ]),
    socialLinks: withIds("social", [
      { platform: "instagram", href: "https://www.instagram.com/cultraven" },
      { platform: "youtube", href: "https://www.youtube.com/cultraven" },
      { platform: "pinterest", href: "https://www.pinterest.com/cultraven" },
    ]),
  },
  "site.trustBadges": {
    items: withIds("trust", [
      { icon: "shipping", title: "Free Delivery ₹999+", subtitle: "Pan-India express dispatch", active: true },
      { icon: "returns", title: "Easy 7-Day Returns", subtitle: "No questions asked", active: true },
      { icon: "secure", title: "100% Secure Checkout", subtitle: "UPI · Cards · Net Banking", active: true },
      { icon: "cod", title: "Cash On Delivery", subtitle: "Available across India", active: true },
    ]),
  },
  "home.categoryStrip": {
    items: withIds("strip", [
      { label: "New In", href: "/collections/new-in", accent: false, active: true },
      { label: "T-Shirts", href: "/collections/t-shirts", accent: false, active: true },
      { label: "Hoodies", href: "/collections/hoodies", accent: false, active: true },
      { label: "Sweatshirts", href: "/collections/sweatshirts", accent: false, active: true },
      { label: "Cargos", href: "/collections/cargos", accent: false, active: true },
      { label: "Jeans", href: "/collections/jeans", accent: false, active: true },
      { label: "Outerwear", href: "/collections/outerwear", accent: false, active: true },
      { label: "Sale", href: "/collections/sale", accent: true, active: true },
    ]),
  },
  "home.categoryTiles": {
    items: withIds("tile", [
      { title: "Oversized Tees", sub: "From ₹1,499", href: "/collections/t-shirts", image: U("1583743814966-8936f5b7be1a"), size: "tall", active: true },
      { title: "Hoodies", sub: "From ₹2,499", href: "/collections/hoodies", image: U("1556821840-3a63f95609a7"), size: "normal", active: true },
      { title: "Cargos & Jeans", sub: "From ₹1,999", href: "/collections/cargos", image: U("1594938298603-c8148c4dae35"), size: "normal", active: true },
      { title: "Outerwear", sub: "From ₹3,499", href: "/collections/outerwear", image: U("1551028719-00167b16eac5"), size: "wide", active: true },
    ]),
  },
  "home.newDrop": { eyebrow: "Just Landed", heading: "New Drop", ctaLabel: "View All New In", ctaHref: "/collections/new-in" },
  "home.bestsellers": { eyebrow: "Most Loved", heading: "The Ones Everyone Wants." },
  "home.trending": {
    heading: "Trending Now",
    items: withIds("trend", [
      { title: "Dragon Blood Graphic Tee", href: "/products/dragon-blood-graphic-tee", image: U("1503341455253-b2e723bb3dbb", 800), alt: "Dragon Blood Graphic Tee", active: true },
      { title: "Dharma EP01 Graphic Hoodie", href: "/products/dharma-ep01-hoodie", image: U("1556821840-3a63f95609a7", 800), alt: "Dharma EP01 Graphic Hoodie", active: true },
      { title: "Raven Multi-Pocket Cargo", href: "/products/raven-cargo-pants", image: U("1552374196-1ab2a1c593e8", 800), alt: "Raven Multi-Pocket Cargo", active: true },
    ]),
  },
  "home.community": {
    eyebrow: "Community",
    heading: "Worn by the Culture.",
    instagramUrl: "https://www.instagram.com/cultraven",
    ctaText: "Tag @cultraven to be featured",
    items: withIds("ugc", [
      { image: U("1515886657613-9f3515b0c78f", 600), alt: "CULTRAVEN community look — oversized tee", active: true },
      { image: U("1509631179647-0177331693ae", 600), alt: "CULTRAVEN community look — streetwear", active: true },
      { image: U("1556821840-3a63f95609a7", 600), alt: "CULTRAVEN community — editorial", active: true },
      { image: U("1503341455253-b2e723bb3dbb", 600), alt: "CULTRAVEN cargo look", active: true },
      { image: U("1515886657613-9f3515b0c78f", 600), alt: "CULTRAVEN graphic tee", active: true },
      { image: U("1583743814966-8936f5b7be1a", 600), alt: "CULTRAVEN hoodie street style", active: true },
    ]),
  },
  "home.brandStory": {
    eyebrow: "THE CULTURE",
    headline: "Clothes aren't just\nwhat you wear.",
    body: "They're how you move through the world. CULTRAVEN is built for\nthe generation that refuses to be defined by anyone else's rules.",
    ctaLabel: "EXPLORE THE STORY",
    ctaHref: "/pages/our-heritage",
    image: U("1503341455253-b2e723bb3dbb", 1400),
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-in-streetwear-standing-outdoors-42289-large.mp4",
  },
  "page.lookbook": {
    items: withIds("look", [
      { season: "AW 2026", title: "RAVEN IN THE CITY", desc: "Oversized graphics, cargo layers, lava accents. The cult on concrete.", image: U("1583743814966-8936f5b7be1a", 800), href: "/collections/dharma", products: withIds("lkp1", [{ name: "Dharma EP01 Tee" }, { name: "Raven Cargo" }, { name: "Lava Stripe Hoodie" }]), active: true },
      { season: "AW 2026", title: "ACID STATE", desc: "Washed-out finishes, heavyweight cotton, zero compromise.", image: U("1503341455253-b2e723bb3dbb", 800), href: "/collections/acid-state", products: withIds("lkp2", [{ name: "Acid State Wash Tee" }, { name: "Wide-Leg Cargo" }, { name: "Dragon Blood Hoodie" }]), active: true },
      { season: "SS 2026", title: "CORE ESSENTIALS", desc: "Stripped back. Built to last. The CULTRAVEN uniform.", image: U("1556821840-3a63f95609a7", 800), href: "/collections/core", products: withIds("lkp3", [{ name: "260 GSM Blank Tee" }, { name: "Cult Wide-Leg Jeans" }, { name: "Core Sweat" }]), active: true },
      { season: "SS 2026", title: "DRAGON BLOOD", desc: "Mythic screen-print meets heavyweight silence.", image: U("1552374196-1ab2a1c593e8", 800), href: "/collections/dragon-blood", products: withIds("lkp4", [{ name: "Dragon Blood Graphic Tee" }, { name: "Raven Black Cargo" }, { name: "Oversized Coach" }]), active: true },
    ]),
  },
  "page.journal": {
    items: withIds("art", [
      { title: "The Rise of the Oversized Silhouette in Indian Streetwear", category: "STYLE", date: "Sep 2026", image: U("1503341455253-b2e723bb3dbb", 800), excerpt: "How the oversized drop-shoulder became the defining shape of a generation's wardrobe.", slug: "oversized-silhouette-indian-streetwear", active: true },
      { title: "What Fabric Weight Actually Means for Your Wardrobe", category: "FASHION", date: "Aug 2026", image: U("1583743814966-8936f5b7be1a", 800), excerpt: "The difference between 160 GSM, 200 GSM and 260 GSM — and why it matters.", slug: "fabric-weight-wardrobe", active: true },
      { title: "Delhi Street Culture: The Photographers Shaping Indian Fashion", category: "CULTURE", date: "Aug 2026", image: U("1515886657613-9f3515b0c78f", 800), excerpt: "Meet the photographers documenting India's growing streetwear scene.", slug: "delhi-street-culture-photographers", active: true },
      { title: "Building a Capsule Wardrobe Around Streetwear Basics", category: "STYLE", date: "Jul 2026", image: U("1529391409740-59f2cea08bc6", 800), excerpt: "Five essentials that work together and anchor everything else.", slug: "capsule-wardrobe-streetwear-basics", active: true },
      { title: "Acid Wash: A History of the Process That Never Goes Out of Style", category: "FASHION", date: "Jul 2026", image: U("1594938298603-c8148c4dae35", 800), excerpt: "From 1980s rock culture to Gen-Z streetwear — why acid wash endures.", slug: "acid-wash-history", active: true },
      { title: "Music and Fashion: The Playlist That's Defining This Season", category: "MUSIC", date: "Jun 2026", image: U("1515886657613-9f3515b0c78f", 800), excerpt: "The tracks behind the CULTRAVEN AW2026 campaign shoot.", slug: "music-fashion-playlist", active: true },
    ]),
  },
  "page.heritage": {
    heroImage: U("1558618666-fcd25c85cd64", 1920),
    sections: withIds("hsec", [
      { tag: "THE BEGINNING", heading: "It started with a tee.", body: "CULTRAVEN was born out of frustration. Frustration at fashion that asked you to blend in. Frustration at streetwear that was either too cheap or too corporate. We wanted something different — clothes that felt like they belonged to us.", image: U("1503341455253-b2e723bb3dbb", 1200), reverse: false, active: true },
      { tag: "THE CULTURE", heading: "Built for the ones who create their own culture.", body: "We don't follow trends. We follow people — the artists, the rebels, the ones who refuse to be defined by a category. CULTRAVEN is for the generation that builds its own culture instead of borrowing someone else's.", image: U("1515886657613-9f3515b0c78f", 1200), reverse: true, active: true },
      { tag: "THE DESIGN", heading: "Every detail is a decision.", body: "260 GSM pre-shrunk heavyweight cotton. Acid wash processes done in small batches. Screen prints that survive a hundred washes. We're obsessive about quality because the people who wear our clothes are obsessive about their identity.", image: U("1583743814966-8936f5b7be1a", 1200), reverse: false, active: true },
      { tag: "THE FUTURE", heading: "Not made to blend in.", body: "We're just getting started. More drops. More stories. More collaborations with artists, photographers and creators who refuse to be ordinary. CULTRAVEN is a movement, not a moment.", image: U("1529391409740-59f2cea08bc6", 1200), reverse: true, active: true },
    ]),
    values: withIds("hval", [
      { title: "Bold", desc: "We don't make timid clothes for timid people." },
      { title: "Premium", desc: "260 GSM. Garment washed. No compromises." },
      { title: "Authentic", desc: "Every design has a story that matters." },
      { title: "Rebellious", desc: "Against the ordinary. Always." },
    ]),
  },
  "shop.collections": {
    items: withIds("coll", [
      { slug: "new-in", name: "New In", description: "The freshest pieces from CULTRAVEN — new drops, updated silhouettes and limited editions.", image: U("1503341455253-b2e723bb3dbb", 1400), active: true },
      { slug: "street", name: "Street", description: "A collection built for movement, individuality and everyday rebellion.", image: U("1515886657613-9f3515b0c78f", 1400), active: true },
      { slug: "bestsellers", name: "Bestsellers", description: "The ones everyone keeps coming back for — our most loved styles.", image: U("1594938298603-c8148c4dae35", 1400), active: true },
      { slug: "essentials", name: "Essentials", description: "Clean, heavyweight basics built to outlast every trend.", image: U("1583743814966-8936f5b7be1a", 1400), active: true },
      { slug: "all", name: "All Products", description: "Every piece from CULTRAVEN — filter, sort and discover.", image: U("1529391409740-59f2cea08bc6", 1400), active: true },
    ]),
  },
  // Promotional banners are intentionally NOT seeded — the section stays hidden until an admin creates one.
};

// ─── Hero / Shop the Look ────────────────────────────────────────────────────

const HERO = {
  type: "image",
  srcDesktop: U("1583743814966-8936f5b7be1a", 1600),
  srcMobile: U("1583743814966-8936f5b7be1a", 800),
  posterSrc: "",
  altText: "CULTRAVEN DHARMA Collection — Gen-Z Streetwear India",
  eyebrow: "Dharma Series EP 01",
  headline: "WEAR YOUR DIFFERENCE.",
  subheadline: "DHARMA EP01 — 260 GSM heavyweight cotton. Mythic screen-prints. Built for those who create their own identity.",
  ctaLabel: "SHOP THE DROP",
  ctaHref: "/collections/new-in",
  objectPosition: "center center",
  overlayOpacity: 0.45,
  durationMs: 5000,
  startsAt: null,
  endsAt: null,
  active: true,
  sortOrder: 0,
};

const SHOP_LOOK = {
  lookLabel: "LOOK 01",
  modelImage: U("1515886657613-9f3515b0c78f"),
  products: [
    { id: "look-1", title: "RAVEN OVERSIZED TEE — ACID BLACK", category: "T-SHIRT", href: "/products/raven-oversized-tee-acid-black", image: U("1583743814966-8936f5b7be1a", 200), pricePaise: 199900, color: "Acid Black" },
    { id: "look-2", title: "CARGO WIDE LEG — MILITARY OLIVE", category: "CARGO", href: "/products/cargo-wide-leg-military-olive", image: U("1576566588028-4147f3842f27", 200), pricePaise: 349900, color: "Military Olive" },
    { id: "look-3", title: "ESSENTIALS HOODIE — WASHED NAVY", category: "HOODIE", href: "/products/essentials-hoodie-washed-navy", image: U("1556821840-3a63f95609a7", 200), pricePaise: 319900, color: "Washed Navy" },
  ],
};

// ─── Products (catalog) ──────────────────────────────────────────────────────

const DESC = "260 GSM heavyweight cotton built for the streets. Oversized fit, pre-washed texture and graphics made for those who create their own identity.";
const SIZES = ["S", "M", "L", "XL"];
const P = (slug, title, category, image, hoverImage, pricePaise, mrpPaise, colors, extra = {}) => ({
  slug, title, category, image, hoverImage, images: [image, hoverImage], pricePaise, mrpPaise, colors,
  description: DESC, sizes: SIZES, fit: "oversized", rating: 5, reviewCount: 0, inStock: true, stockCount: 50,
  isNewArrival: false, isBestseller: false, ...extra,
});
const PRODUCTS = [
  P("raven-oversized-tee-acid-black", "Raven Oversized Tee — Acid Black", "tees", U("1583743814966-8936f5b7be1a", 700), U("1503341455253-b2e723bb3dbb", 700), 199900, 249900, [{ hex: "#0A0A0A", label: "Acid Black" }, { hex: "#2C2C2C", label: "Charcoal" }, { hex: "#DAB205", label: "Flame" }], { isNewArrival: true }),
  P("dharma-graphic-hoodie-stone", "Dharma Graphic Hoodie — Stone Wash", "hoodies", U("1556821840-3a63f95609a7", 700), U("1512411933099-b1d5565538e1", 700), 299900, 399900, [{ hex: "#EDE3CF", label: "Stone" }, { hex: "#172554", label: "Navy" }, { hex: "#7A7468", label: "Ash" }], { isNewArrival: true }),
  P("raven-cargo-military-olive", "Raven Cargo — Military Olive", "bottoms", U("1552374196-1ab2a1c593e8", 700), U("1620799140408-edc6dcb6d633", 700), 249900, 299900, [{ hex: "#556B2F", label: "Olive" }, { hex: "#172554", label: "Navy" }, { hex: "#0A0A0A", label: "Black" }], { isNewArrival: true, badge: "LIMITED" }),
  P("acid-state-sweatshirt-washed-grey", "Acid State Sweatshirt — Washed Grey", "hoodies", U("1578681994506-b8f463449011", 700), U("1503342394128-c104d54dba01", 700), 249900, 299900, [{ hex: "#9CA3AF", label: "Washed Grey" }, { hex: "#0A0A0A", label: "Black" }, { hex: "#EDE3CF", label: "Cream" }], { isNewArrival: true }),
  P("classic-oversized-tee-black", "Classic Oversized Tee — Black", "tees", U("1503341455253-b2e723bb3dbb", 600), U("1583743814966-8936f5b7be1a", 600), 189900, 189900, [{ hex: "#0A0A0A", label: "Black" }, { hex: "#FAF9F6", label: "White" }, { hex: "#172554", label: "Navy" }], { isBestseller: true, badge: "BESTSELLER", reviewCount: 248 }),
  P("dragon-blood-graphic-charcoal", "Dragon Blood Graphic — Charcoal", "tees", U("1515886657613-9f3515b0c78f", 600), U("1556821840-3a63f95609a7", 600), 249900, 299900, [{ hex: "#2C2C2C", label: "Charcoal" }, { hex: "#172554", label: "Navy" }], { isBestseller: true, badge: "BESTSELLER", reviewCount: 184 }),
  P("essentials-hoodie-washed-navy", "Essentials Hoodie — Washed Navy", "hoodies", U("1594938298603-c8148c4dae35", 600), U("1578768079052-aa76e52ff62e", 600), 319900, 399900, [{ hex: "#172554", label: "Washed Navy" }, { hex: "#0A0A0A", label: "Jet Black" }, { hex: "#7A7468", label: "Ash" }], { isBestseller: true, rating: 4, reviewCount: 132 }),
  P("lava-stripe-cargo-sand", "Lava Stripe Cargo — Sand", "bottoms", U("1594938298603-c8148c4dae35", 600), U("1576566588028-4147f3842f27", 600), 379900, 499900, [{ hex: "#C4A882", label: "Sand" }, { hex: "#556B2F", label: "Olive" }, { hex: "#0A0A0A", label: "Black" }], { isBestseller: true, badge: "LOW STOCK", reviewCount: 97 }),
  P("acid-state-sweatshirt-stone", "Acid State Sweatshirt — Stone", "hoodies", U("1515886657613-9f3515b0c78f", 600), U("1521572163474-6864f9cf17ab", 600), 259900, 319900, [{ hex: "#EDE3CF", label: "Stone" }, { hex: "#9CA3AF", label: "Washed Grey" }], { isBestseller: true, rating: 4, reviewCount: 76 }),
  P("relaxed-shirt-white", "Cultraven Relaxed Shirt — White", "shirts", U("1585487000160-6ebcfceb0d03", 600), U("1515886657613-9f3515b0c78f", 600), 299900, 299900, [{ hex: "#FFFFFF", label: "White" }, { hex: "#EDE3CF", label: "Cream" }], { isBestseller: true, fit: "relaxed", reviewCount: 61 }),
  P("cargo-wide-leg-military-olive", "Cargo Wide Leg — Military Olive", "bottoms", U("1576566588028-4147f3842f27", 700), U("1552374196-1ab2a1c593e8", 700), 349900, 499900, [{ hex: "#556B2F", label: "Military Olive" }], { fit: "baggy" }),
];

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  const summary = [];
  if (DRY) {
    console.log("[dry-run] would seed sections:", Object.keys(SECTIONS).join(", "));
    console.log(`[dry-run] would seed ${PRODUCTS.length} products, 1 hero slide, 1 shop-the-look`);
    return;
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set (apps/web/.env)");
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  } catch (e) {
    // Some local resolvers / VPNs refuse the SRV lookup mongodb+srv:// needs — retry with public DNS.
    if (!/querySrv/.test(String(e.message))) throw e;
    const servers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map((s) => s.trim());
    console.warn(`SRV lookup failed with system DNS (${dns.getServers().join(", ")}); retrying with ${servers.join(", ")}`);
    dns.setServers(servers);
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  }
  const db = mongoose.connection.db;
  const now = new Date();

  // Sections
  for (const [key, data] of Object.entries(SECTIONS)) {
    const res = await db.collection("cmssections").updateOne(
      { key },
      FORCE
        ? { $set: { data, updatedAt: now }, $setOnInsert: { key, createdAt: now } }
        : { $setOnInsert: { key, data, createdAt: now, updatedAt: now } },
      { upsert: true }
    );
    summary.push(`${key}: ${res.upsertedCount ? "created" : FORCE ? "overwritten" : "kept (already exists)"}`);
  }

  // Hero (only when there are no slides yet, or --force)
  const heroCount = await db.collection("herobanners").countDocuments();
  if (heroCount === 0 || FORCE) {
    if (FORCE) await db.collection("herobanners").deleteMany({});
    await db.collection("herobanners").insertOne({ ...HERO, createdAt: now, updatedAt: now });
    summary.push("hero: slide created");
  } else summary.push(`hero: kept (${heroCount} slide(s) exist)`);
  await db.collection("heroconfigs").updateOne({ key: "homepage" }, { $setOnInsert: { key: "homepage", mode: "slideshow", createdAt: now, updatedAt: now } }, { upsert: true });

  // Shop the look
  const lookCount = await db.collection("shoplooks").countDocuments();
  if (lookCount === 0 || FORCE) {
    if (FORCE) await db.collection("shoplooks").deleteMany({});
    await db.collection("shoplooks").insertOne({ ...SHOP_LOOK, createdAt: now, updatedAt: now });
    summary.push("shop-the-look: created");
  } else summary.push("shop-the-look: kept");

  // Products — upsert by slug, NEVER overwrite an existing product
  let created = 0;
  for (const p of PRODUCTS) {
    const res = await db.collection("products").updateOne({ slug: p.slug }, { $setOnInsert: { ...p, createdAt: now, updatedAt: now } }, { upsert: true });
    if (res.upsertedCount) created++;
  }
  summary.push(`products: ${created} created, ${PRODUCTS.length - created} already existed`);

  console.log("\nSeed complete:\n - " + summary.join("\n - "));
  await mongoose.disconnect();
}

main().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
