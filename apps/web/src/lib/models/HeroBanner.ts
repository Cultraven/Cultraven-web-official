import mongoose from "mongoose";

const HeroBannerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true, default: "image" },
    srcDesktop: { type: String, required: true },
    headline: { type: String },
    subheadline: { type: String },
    ctaLabel: { type: String, default: "SHOP NOW" },
    ctaHref: { type: String, default: "/collections/all" },
    overlayOpacity: { type: Number, default: 0.4 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HeroBanner =
  mongoose.models.HeroBanner || mongoose.model("HeroBanner", HeroBannerSchema);
