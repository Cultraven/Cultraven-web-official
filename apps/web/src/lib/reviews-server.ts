import { Review } from "@/lib/models/Review";
import { Product } from "@/lib/models/Product";
import { averageRating } from "@/lib/review-schema";

/** Keep the denormalised rating/reviewCount on the product (used by cards) in step with its reviews. */
export async function syncProductRating(productId: string, slug: string) {
  const all = (await Review.find({ slug }).select("rating").lean()) as any[];
  await Product.findByIdAndUpdate(productId, { rating: averageRating(all.map((r) => r.rating)), reviewCount: all.length });
}
