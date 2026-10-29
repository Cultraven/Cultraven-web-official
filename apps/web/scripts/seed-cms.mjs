/**
 * Database seed — `pnpm db:seed` (from repo root) or `pnpm --filter @shop/web db:seed`.
 *
 * Creates the INITIAL content records the storefront needs. After seeding, both the
 * Admin Panel and the public website read these records from MongoDB. No component
 * imports this file.
 *
 * It seeds NO sample products, reviews, orders, trending cards, community photos or "Shop the look":
 * those stay empty (the site shows "Coming soon") until the owner adds them in the admin.
 *
 * Safe to run repeatedly: every record is inserted only if it does not exist yet
 * ($setOnInsert / "only if empty"), so admin edits are never overwritten.
 *   --force   overwrite existing CMS sections + reseed the hero slide (this REPLACES what the owner saved in the admin)
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
    enabled: true,
    intervalMs: 4000,
    items: withIds("ann", [
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
        label: "COLLECTIONS", href: "", active: true,
        columns: withIds("navcol-drops", [
          { heading: "Collections", items: withIds("navlink-col", [
            { label: "All Collections", href: "/collections", isNew: false },
          ]) },
          { heading: "Explore", items: withIds("navlink-exp", [
            { label: "Best Sellers", href: "/collections/bestsellers", isNew: false },
            { label: "Under ₹1,999", href: "/collections/sale", isNew: false },
            { label: "Lookbook", href: "/pages/lookbook", isNew: false },
            { label: "Style Blog", href: "/pages/journal", isNew: false },
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
      { heading: "Company", links: withIds("flink-brand", [
        { label: "Our Heritage", href: "/pages/our-heritage", openInNew: false },
        { label: "Journal", href: "/pages/journal", openInNew: false },
        { label: "Size Guide", href: "/pages/size-guide", openInNew: false },
        { label: "Contact", href: "/pages/contact", openInNew: false },
      ]) },
    ]),
  },
  // Social pages: edited in Admin -> Website content -> Social links (footer icons, chat window, contact page, Google business data).
  "site.social": {
    items: withIds("social", [
      { platform: "instagram", href: "https://www.instagram.com/cultraven._/", active: true },
      { platform: "twitter", href: "https://x.com/cultraven_", active: true },
      { platform: "facebook", href: "https://www.facebook.com/profile.php?id=61595224413709", active: true },
      { platform: "reddit", href: "https://www.reddit.com/user/Cultraven_official/", active: true },
    ]),
  },
  "site.trustBadges": {
    items: withIds("trust", [
      { icon: "shipping", title: "Free Delivery ₹1,999+", subtitle: "Ships across India", active: true },
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
      { title: "Oversized Tees", sub: "", href: "/collections/t-shirts", image: U("1583743814966-8936f5b7be1a"), size: "tall", active: true },
      { title: "Hoodies", sub: "", href: "/collections/hoodies", image: U("1556821840-3a63f95609a7"), size: "normal", active: true },
      { title: "Cargos & Jeans", sub: "", href: "/collections/cargos", image: U("1594938298603-c8148c4dae35"), size: "normal", active: true },
      { title: "Outerwear", sub: "", href: "/collections/outerwear", image: U("1551028719-00167b16eac5"), size: "wide", active: true },
    ]),
  },
  // Scrolling strip under the hero banner: Admin -> Website content -> Hero ribbon (on/off switch, colour, speed, messages).
  "home.heroRibbon": {
    enabled: true,
    tone: "Navy",
    seconds: 40,
    dismissible: true,
    items: withIds("ribbon", [
      { text: "NEW DROP", active: true },
      { text: "COMING SOON", active: true },
    ]),
  },
  "home.newDrop": { eyebrow: "Just In", heading: "New Arrivals", ctaLabel: "View All New In", ctaHref: "/collections/new-in" },
  "home.bestsellers": { eyebrow: "Most Loved", heading: "Best Sellers" },
  // Trending and Community start EMPTY: the home page shows "Coming soon" until real cards / photos are added in the admin.
  "home.trending": { heading: "Trending Now", items: [] },
  "home.community": {
    eyebrow: "Community",
    heading: "Worn by the culture",
    instagramUrl: "https://www.instagram.com/cultraven._/",
    ctaText: "Tag @cultraven._ to be featured",
    items: [],
  },
  "home.brandStory": {
    eyebrow: "WHY CULTRAVEN",
    headline: "Premium quality.\nDelivered to your door.",
    body: "260 GSM heavyweight cotton, pre-washed fits and easy 7-day returns. Free delivery above ₹1,999 and Cash on Delivery available across India.",
    ctaLabel: "ABOUT CULTRAVEN",
    ctaHref: "/pages/our-heritage",
    // No stock photo or video: the section shows the plain CULTRAVEN look until the owner adds media in the admin.
    image: "",
    videoUrl: "",
  },
  // Lookbook and Journal start EMPTY: those pages show "coming soon" until real looks / articles are added in the admin.
  "page.lookbook": { items: [] },
  "page.journal": { items: [] },
  "page.heritage": {
    heroImage: U("1558618666-fcd25c85cd64", 1920),
    sections: withIds("hsec", [
      { tag: "THE BEGINNING", heading: "It started with a tee.", body: "CULTRAVEN was born out of frustration. Frustration at fashion that asked you to blend in. Frustration at streetwear that was either too cheap or too corporate. We wanted something different — clothes that felt like they belonged to us.", image: U("1503341455253-b2e723bb3dbb", 1200), reverse: false, active: true },
      { tag: "THE CULTURE", heading: "Built for the ones who create their own culture.", body: "We don't follow trends. We follow people — the artists, the rebels, the ones who refuse to be defined by a category. CULTRAVEN is for the generation that builds its own culture instead of borrowing someone else's.", image: U("1515886657613-9f3515b0c78f", 1200), reverse: true, active: true },
      { tag: "THE DESIGN", heading: "Every detail is a decision.", body: "260 GSM pre-shrunk heavyweight cotton. Acid wash processes done in small batches. Screen prints that survive a hundred washes. We're obsessive about quality because the people who wear our clothes are obsessive about their identity.", image: U("1583743814966-8936f5b7be1a", 1200), reverse: false, active: true },
      { tag: "THE FUTURE", heading: "Not made to blend in.", body: "We're just getting started. More collections. More stories. More collaborations with artists, photographers and creators who refuse to be ordinary. CULTRAVEN is a movement, not a moment.", image: U("1529391409740-59f2cea08bc6", 1200), reverse: true, active: true },
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
      { slug: "new-in", name: "New In", description: "The freshest pieces from CULTRAVEN — new arrivals, updated fits and limited editions.", image: U("1503341455253-b2e723bb3dbb", 1400), active: true },
      { slug: "bestsellers", name: "Bestsellers", description: "The ones everyone keeps coming back for — our most loved styles.", image: U("1556821840-3a63f95609a7", 1400), active: true },
      { slug: "all", name: "All Products", description: "Every piece from CULTRAVEN — filter, sort and discover.", image: U("1489987707025-afc232f7ea0f", 1400), active: true },
    ]),
  },
  // Logo & site images: empty = the built-in images in /public.
  "site.branding": { logoHorizontal: "", logoStacked: "", logoMark: "", favicon: "", shareImage: "" },
  // Page banners: one entry per inner page so every page shows up in Admin -> Website content -> Page banners, ready for a photo.
  "site.pageBanners": {
    items: withIds("banner", ["our-heritage", "lookbook", "journal", "contact", "size-guide", "terms", "privacy", "shipping", "returns"].map((page) => ({
      page, image: page === "our-heritage" ? U("1558618666-fcd25c85cd64", 1920) : "", overlay: 55, eyebrow: "", title: "", subtitle: "", active: true,
    }))),
  },
  // Policy pages (Terms, Privacy, Shipping, Returns): the same wording the site falls back to, kept in one JSON file.
  ...JSON.parse(fs.readFileSync(path.join(here, "../src/lib/cms/legal-defaults.json"), "utf8")),
  // Promotional banners are intentionally NOT seeded — the section stays hidden until an admin creates one.
};

// ─── Hero / Shop the Look ────────────────────────────────────────────────────

const HERO = {
  type: "image",
  srcDesktop: U("1583743814966-8936f5b7be1a", 1600),
  srcMobile: U("1583743814966-8936f5b7be1a", 800),
  posterSrc: "",
  altText: "CULTRAVEN — Oversized T-Shirts & Hoodies",
  eyebrow: "",
  headline: "WEAR YOUR DIFFERENCE.",
  subheadline: "260 GSM heavyweight cotton with premium screen-prints. Free delivery above ₹1,999.",
  ctaLabel: "SHOP NOW",
  ctaHref: "/collections/new-in",
  objectPosition: "center center",
  overlayOpacity: 0.45,
  durationMs: 5000,
  startsAt: null,
  endsAt: null,
  active: true,
  sortOrder: 0,
};

// No sample Shop the Look and no sample products are seeded: add them in the admin (Admin -> Products, Admin -> Shop the look).

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  const summary = [];
  if (DRY) {
    console.log("[dry-run] would seed sections:", Object.keys(SECTIONS).join(", "));
    console.log("[dry-run] would seed 1 hero slide (no products, no shop-the-look)");
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

  console.log("\nSeed complete:\n - " + summary.join("\n - "));
  await mongoose.disconnect();
}

main().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
