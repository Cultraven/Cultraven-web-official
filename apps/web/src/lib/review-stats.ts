/**
 * Star ratings and review counts shown on product cards come from the real reviews customers wrote (the reviews collection),
 * never from numbers typed into a product. A product with no reviews shows no stars.
 */
import { Review } from "@/lib/models/Review";

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function applyReviewStats<T extends { slug: string; rating: number; reviewCount: number }>(items: T[]): Promise<T[]> {
  const slugs = Array.from(new Set(items.map((p) => p.slug).filter(Boolean)));
  const stats = new Map<string, { avg: number; n: number }>();
  if (slugs.length) {
    const rows = (await Review.aggregate([{ $match: { slug: { $in: slugs } } }, { $group: { _id: "$slug", avg: { $avg: "$rating" }, n: { $sum: 1 } } }])) as { _id: string; avg: number; n: number }[];
    for (const r of rows) stats.set(r._id, { avg: r.avg, n: r.n });
  }
  for (const p of items) {
    const s = stats.get(p.slug);
    p.rating = s ? round1(s.avg) : 0;
    p.reviewCount = s ? s.n : 0;
  }
  return items;
}
