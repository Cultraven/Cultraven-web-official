/**
 * What a product card shows, worked out in one place (pure — shared by every listing: collections, category, search,
 * the home sections). Price is the lowest price among sizes you can actually buy; "Only few left" and the size line
 * only talk about sizes that are in stock.
 */
import { FREE_SIZE, discountPercent, effectiveSizes, priceForSize, type PublicSizeOption, type SizeOption } from "./size-pricing";

export interface CardProduct {
  id: string;
  href: string;
  title: string;
  image: string;
  hoverImage?: string;
  pricePaise: number;
  mrpPaise?: number;
  rating?: number;
  reviewCount?: number;
  colors?: { hex: string; label: string }[];
  sizes?: string[];
  sizeOptions?: PublicSizeOption[];
  inStock?: boolean;
  badge?: string;
  isNewArrival?: boolean;
}

export interface CardSize { size: string; pricePaise: number; mrpPaise: number; soldOut: boolean; low: boolean }

export interface CardView {
  sizes: CardSize[];
  soldOut: boolean;
  pricePaise: number;
  mrpPaise: number;
  /** % off MRP for the price shown (0 = no discount). */
  off: number;
  /** Sizes have different prices, so the shown price is a "starting at". */
  varies: boolean;
  /** At least one size is nearly gone (or the admin tagged the product LOW STOCK). */
  fewLeft: boolean;
  /** "S, M, L, XL" — only sizes in stock. */
  sizeLabel: string;
  /** The tag on the photo: SOLD OUT, the admin's own badge, or NEW. LOW STOCK is shown as text instead. */
  badge: string;
}

export const slugFromHref = (href: string): string => href.replace(/^\/products\//, "").split(/[?#]/)[0];

export function cardView(p: CardProduct): CardView {
  const base = { pricePaise: p.pricePaise, mrpPaise: p.mrpPaise ?? p.pricePaise };
  const options = (p.sizeOptions ?? []) as SizeOption[];
  const flag = (size: string) => (p.sizeOptions ?? []).find((o) => o.size === size);

  const sizes: CardSize[] = effectiveSizes(p.sizes).map((size) => {
    const { pricePaise, mrpPaise } = priceForSize(base, options, size);
    const o = flag(size);
    return { size, pricePaise, mrpPaise, soldOut: p.inStock === false || o?.soldOut === true, low: o?.low === true };
  });

  const sellable = sizes.filter((s) => !s.soldOut);
  const pool = sellable.length ? sellable : sizes;
  const best = pool.reduce((a, b) => (b.pricePaise < a.pricePaise ? b : a), pool[0]);
  const soldOut = sellable.length === 0;
  const lowStockBadge = (p.badge ?? "").trim().toUpperCase() === "LOW STOCK";
  const ownBadge = !lowStockBadge && p.badge ? p.badge.trim() : "";

  return {
    sizes,
    soldOut,
    pricePaise: best.pricePaise,
    mrpPaise: best.mrpPaise,
    off: discountPercent(best.pricePaise, best.mrpPaise),
    varies: new Set(pool.map((s) => s.pricePaise)).size > 1,
    fewLeft: !soldOut && (sellable.some((s) => s.low) || lowStockBadge),
    sizeLabel: sellable.map((s) => s.size).join(", "),
    badge: soldOut ? "SOLD OUT" : ownBadge || (p.isNewArrival ? "NEW" : ""),
  };
}

/** True when the only size is the "Free Size" placeholder (no size picker needed). */
export const isFreeSizeOnly = (sizes: CardSize[]) => sizes.length === 1 && sizes[0].size === FREE_SIZE;
