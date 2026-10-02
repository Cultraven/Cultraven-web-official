import mongoose from "mongoose";

/** A customer review of a purchased product. One review per (user, product). Shown on the product page. */
const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    slug: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    name: { type: String, required: true, maxlength: 60 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", maxlength: 80 },
    comment: { type: String, required: true, maxlength: 1000 },
    /** Size the customer bought (shown as "Verified purchase · M"). */
    size: { type: String, default: "" },
  },
  { timestamps: true }
);

ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
