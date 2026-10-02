import { z } from "zod";

/** Strip control chars + tags; collapse whitespace. Reviews are rendered as text, this is defence in depth. */
export function cleanText(v: string): string {
  return v.replace(/<[^>]*>/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[ \t]+/g, " ").trim();
}

export const ReviewWriteSchema = z.object({
  slug: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(80).transform(cleanText).default(""),
  comment: z.string().transform(cleanText).pipe(z.string().min(10, "Please write at least 10 characters").max(1000)),
});

/** "Aarav Sharma" → "Aarav S." — public reviews never show a full surname or email. */
export function publicName(first?: string, last?: string, email?: string): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f) return l ? `${f} ${l[0].toUpperCase()}.` : f;
  const local = (email ?? "").split("@")[0].trim();
  return local ? `${local[0].toUpperCase()}${"•".repeat(Math.min(3, Math.max(0, local.length - 1)))}` : "Customer";
}

/** Rounded to 1 decimal; 0 when there are no reviews. */
export function averageRating(ratings: number[]): number {
  if (!ratings.length) return 0;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}
