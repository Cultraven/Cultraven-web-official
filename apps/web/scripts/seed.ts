import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

// Minimal schemas for seeding
const HeroBannerSchema = new mongoose.Schema({
  type: String,
  srcDesktop: String,
  headline: String,
  subheadline: String,
  ctaLabel: String,
  ctaHref: String,
  overlayOpacity: Number,
  active: Boolean,
});

const ProductSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  image: String,
  hoverImage: String,
  pricePaise: Number,
  mrpPaise: Number,
  category: String,
  fit: String,
  inStock: Boolean,
  stockCount: Number,
});

const HeroBanner = mongoose.models.HeroBanner || mongoose.model("HeroBanner", HeroBannerSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

const HERO_BANNERS = [
  {
    type: "image",
    srcDesktop: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1400&auto=format&fit=crop&q=85",
    headline: "BUILT FOR THE MOVEMENT",
    subheadline: "260 GSM heavyweight streetwear. Not made to blend in.",
    ctaLabel: "SHOP NEW ARRIVALS",
    ctaHref: "/collections/new-in",
    overlayOpacity: 0.45,
    active: true,
  },
  {
    type: "image",
    srcDesktop: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=1400&auto=format&fit=crop&q=85",
    headline: "THE RAVEN COLLECTION",
    subheadline: "Oversized silhouettes. Premium cotton. Zero compromises.",
    ctaLabel: "EXPLORE COLLECTION",
    ctaHref: "/collections/street",
    overlayOpacity: 0.4,
    active: true,
  }
];

const PRODUCTS = [
  {
    title: "Raven Oversized Tee — Acid Black",
    slug: "raven-oversized-tee-acid-black",
    description: "Heavyweight 260 GSM premium cotton tee.",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    pricePaise: 199900,
    mrpPaise: 299900,
    category: "T-Shirts",
    fit: "Oversized",
    inStock: true,
    stockCount: 82,
  },
  {
    title: "Cargo Wide Leg — Military Olive",
    slug: "cargo-wide-leg-military-olive",
    description: "Relaxed fit multi-pocket cargo pants.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    pricePaise: 349900,
    mrpPaise: 499900,
    category: "Bottoms",
    fit: "Relaxed",
    inStock: true,
    stockCount: 34,
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB.");

    await HeroBanner.deleteMany({});
    await HeroBanner.insertMany(HERO_BANNERS);
    console.log("Seeded Hero Banners");

    await Product.deleteMany({});
    await Product.insertMany(PRODUCTS);
    console.log("Seeded Products");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
