import { z } from "zod";
import { isSafeMediaUrl } from "./hero";

const mediaUrl = z.string().refine((v) => isSafeMediaUrl(v, false), "Must be an https:// URL or an uploaded file");

/** Server-side validation for every product create / update. */
export const ProductWriteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug may only contain a-z, 0-9 and dashes"),
  description: z.string().trim().min(1).max(2000),
  pricePaise: z.number().int().positive(),
  mrpPaise: z.number().int().positive().optional(),
  image: mediaUrl,
  hoverImage: mediaUrl.or(z.literal("")).optional(),
  images: z.array(mediaUrl).max(12).optional(),
  category: z.string().trim().min(1).max(50),
  fit: z.string().trim().min(1).max(30).default("regular"),
  sizes: z.array(z.string().max(20)).max(20).optional(),
  colors: z
    .array(z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a #RRGGBB hex"), label: z.string().trim().min(1).max(50) }))
    .max(20)
    .optional(),
  inStock: z.boolean().optional(),
  badge: z.string().max(30).optional().nullable(),
  isNewArrival: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
});
