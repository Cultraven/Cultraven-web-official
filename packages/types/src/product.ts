import { z } from "zod";

export const ProductVariantSchema = z.object({
  sku: z.string(),
  size: z.string(),
  color: z.string(),
  pricePaise: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  categoryIds: z.array(z.string()),
  images: z.array(z.string().url()),
  variants: z.array(ProductVariantSchema).min(1),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
