import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    hoverImage: { type: String },
    /** Product gallery (ordered). Empty → falls back to image + hoverImage. */
    images: { type: [String], default: [] },
    isNewArrival: { type: Boolean, default: false, index: true },
    isBestseller: { type: Boolean, default: false, index: true },
    pricePaise: { type: Number, required: true },
    mrpPaise: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    colors: [
      {
        hex: { type: String, required: true },
        label: { type: String, required: true },
      }
    ],
    sizes: [{ type: String, required: true }],
    category: { type: String, required: true },
    fit: { type: String, required: true },
    badge: { type: String },
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
