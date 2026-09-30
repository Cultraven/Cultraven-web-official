import mongoose from "mongoose";

/**
 * One document per hero slide (one-to-many under the hero "config").
 * srcDesktop/srcMobile hold an image OR a video URL depending on `type`.
 * Media binaries live in storage (public/uploads or an https CDN) — only references are stored here.
 */
const HeroBannerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true, default: "image" },
    srcDesktop: { type: String, required: true },
    srcMobile: { type: String, default: "" },
    posterSrc: { type: String, default: "" },
    altText: { type: String, default: "" },
    eyebrow: { type: String, default: "" },
    headline: { type: String, default: "" },
    subheadline: { type: String, default: "" },
    ctaLabel: { type: String, default: "SHOP NOW" },
    ctaHref: { type: String, default: "/collections/all" },
    objectPosition: { type: String, default: "center center" },
    overlayOpacity: { type: Number, default: 0.4 },
    durationMs: { type: Number, default: 5000 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const HeroBanner =
  mongoose.models.HeroBanner || mongoose.model("HeroBanner", HeroBannerSchema);

const HeroConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: "homepage", unique: true },
    mode: { type: String, enum: ["image", "video", "slideshow"], default: "slideshow" },
  },
  { timestamps: true }
);

export const HeroConfig =
  mongoose.models.HeroConfig || mongoose.model("HeroConfig", HeroConfigSchema);
