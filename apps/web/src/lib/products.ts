import { normalizeSizeOptions, toPublicSizeOptions, type PublicSizeOption, type SizeOption } from "@/lib/size-pricing";
/** Shared product shaping — used by the /api/products routes and server-side page data. */

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface PublicProduct {
  id: string;
  title: string;
  slug: string;
  href: string;
  description: string;
  image: string;
  hoverImage: string;
  images: string[];
  pricePaise: number;
  mrpPaise: number;
  rating: number;
  reviewCount: number;
  colors: { hex: string; label: string }[];
  sizes: string[];
  category: string;
  fit: string;
  badge?: string;
  inStock: boolean;
  /** Per-size price overrides + sold-out flags (no raw stock counts). */
  sizeOptions: PublicSizeOption[];
  /** Admin only: the raw per-size options including stock counts. */
  sizeOptionsAdmin?: SizeOption[];
  isNewArrival: boolean;
  isBestseller: boolean;
}

/** Normalise a raw DB product so colors / sizes / images are always clean arrays. */
export function normalizeProduct(doc: any, opts: { admin?: boolean } = {}): PublicProduct {
  const colors = Array.isArray(doc.colors)
    ? doc.colors
        .filter((c: any) => c && typeof c.hex === "string" && typeof c.label === "string")
        .map((c: any) => ({ hex: c.hex, label: c.label }))
    : [];
  const sizes = Array.isArray(doc.sizes) ? doc.sizes.filter((s: any) => s && typeof s === "string") : [];

  // Gallery: explicit images first, else main + hover image (deduplicated, empty removed).
  const gallery: string[] = Array.isArray(doc.images) ? doc.images.filter((u: any) => typeof u === "string" && u) : [];
  const images = gallery.length > 0 ? gallery : [doc.image, doc.hoverImage].filter((u: any) => typeof u === "string" && u);

  return {
    id: doc._id ? doc._id.toString() : String(doc.id ?? ""),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    href: `/products/${doc.slug ?? ""}`,
    description: doc.description ?? "",
    image: doc.image ?? images[0] ?? "",
    hoverImage: doc.hoverImage ?? images[1] ?? doc.image ?? "",
    images: Array.from(new Set(images)),
    pricePaise: Number(doc.pricePaise) || 0,
    mrpPaise: Number(doc.mrpPaise ?? doc.pricePaise) || 0,
    rating: Number(doc.rating) || 0,
    reviewCount: Number(doc.reviewCount) || 0,
    colors,
    sizes,
    category: doc.category ?? "",
    fit: doc.fit ?? "",
    badge: doc.badge ?? undefined,
    inStock: doc.inStock !== false,
    sizeOptions: toPublicSizeOptions(normalizeSizeOptions(doc.sizeOptions, sizes), sizes),
    ...(opts.admin ? { sizeOptionsAdmin: normalizeSizeOptions(doc.sizeOptions, sizes) } : {}),
    isNewArrival: doc.isNewArrival === true,
    isBestseller: doc.isBestseller === true,
  };
}
