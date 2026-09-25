import { z } from "zod";

// ─── Product Variant ──────────────────────────────────────────────────────────

export const ProductVariantSchema = z.object({
  sku: z.string(),
  size: z.string(),
  color: z.string(),
  colorHex: z.string().optional(), // e.g. "#1C1C1C" for swatch display
  pricePaise: z.number().int().nonnegative(),
  /**
   * Maximum retail price in paise.
   * When mrpPaise > pricePaise, the UI shows a strikethrough MRP.
   */
  mrpPaise: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
});

// ─── Product ──────────────────────────────────────────────────────────────────

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  categoryIds: z.array(z.string()),
  /**
   * images[0] → primary (shown on card)
   * images[1] → hover image (swapped on mouse-enter)
   * images[2+] → PDP gallery
   */
  images: z.array(z.string().url()),
  variants: z.array(ProductVariantSchema).min(1),
  status: z.enum(["draft", "active", "archived"]).default("draft"),

  // ─── Merchandising flags (set by admin) ───────────────────────────────────
  isNewArrival: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),

  // ─── SEO / metadata ───────────────────────────────────────────────────────
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),

  // ─── Timestamps ───────────────────────────────────────────────────────────
  createdAt: z.string().optional(), // ISO date string from API
  updatedAt: z.string().optional(),
});

// ─── Computed Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the lowest pricePaise across all variants.
 * Use for listing/carousel display.
 */
export function lowestPrice(
  variants: Array<{ pricePaise: number }>
): number {
  return Math.min(...variants.map((v) => v.pricePaise));
}

/**
 * Returns the lowest mrpPaise across all variants, if any.
 */
export function lowestMrp(
  variants: Array<{ mrpPaise?: number | undefined }>
): number | undefined {
  const mrps = variants
    .map((v) => v.mrpPaise)
    .filter((m): m is number => m !== undefined);
  return mrps.length > 0 ? Math.min(...mrps) : undefined;
}

/**
 * Formats paise to an INR display string (e.g. 299900 → "₹2,999").
 */
export function formatPriceINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

// ─── TypeScript Exports ───────────────────────────────────────────────────────

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
