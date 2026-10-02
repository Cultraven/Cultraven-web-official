/**
 * Per-size price and stock. A product has one base price; any size can override the price / MRP (e.g. XL costs more)
 * and carry its own stock count. Pure functions shared by the product page, the cart, the admin form and the order
 * API, so the price a customer sees is always the price the server charges.
 */

export const FREE_SIZE = "Free Size";

/** Stored on the product (admin). Absent price/mrp = use the base price; absent stock = not tracked per size. */
export interface SizeOption { size: string; pricePaise?: number; mrpPaise?: number; stockCount?: number }

/** What the storefront sees: no raw stock numbers, just whether the size can be bought. */
export interface PublicSizeOption { size: string; pricePaise?: number; mrpPaise?: number; soldOut: boolean; low: boolean }

export const LOW_STOCK_THRESHOLD = 5;

const posInt = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined);
const nonNegInt = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined);

/** Sizes shown to shoppers: a product with no sizes is sold as one "Free Size" instead of showing an empty selector. */
export function effectiveSizes(sizes: string[] | undefined | null): string[] {
  const clean = (sizes ?? []).map((s) => String(s).trim()).filter(Boolean);
  return clean.length ? Array.from(new Set(clean)) : [FREE_SIZE];
}

/** Clean raw DB / form data: only known sizes, no duplicates, sane numbers; entries that change nothing are dropped. */
export function normalizeSizeOptions(raw: unknown, sizes: string[] | undefined | null): SizeOption[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(effectiveSizes(sizes));
  const seen = new Set<string>();
  const out: SizeOption[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const size = String((r as any).size ?? "").trim();
    if (!size || !allowed.has(size) || seen.has(size)) continue;
    seen.add(size);
    const pricePaise = posInt((r as any).pricePaise);
    const mrpPaise = posInt((r as any).mrpPaise);
    const stockCount = nonNegInt((r as any).stockCount);
    if (pricePaise === undefined && mrpPaise === undefined && stockCount === undefined) continue;
    out.push({ size, ...(pricePaise !== undefined ? { pricePaise } : {}), ...(mrpPaise !== undefined ? { mrpPaise } : {}), ...(stockCount !== undefined ? { stockCount } : {}) });
  }
  return out;
}

const find = (options: SizeOption[] | undefined | null, size: string | null | undefined) => (options ?? []).find((o) => o.size === size);

/** Selling price + MRP for one size (falls back to the base). MRP is never below the selling price. */
export function priceForSize(base: { pricePaise: number; mrpPaise?: number }, options: SizeOption[] | undefined | null, size: string | null | undefined): { pricePaise: number; mrpPaise: number } {
  const o = find(options, size);
  const pricePaise = o?.pricePaise ?? base.pricePaise;
  const mrp = o?.mrpPaise ?? (o?.pricePaise !== undefined && base.mrpPaise !== undefined && base.mrpPaise < o.pricePaise ? o.pricePaise : base.mrpPaise ?? base.pricePaise);
  return { pricePaise, mrpPaise: Math.max(mrp, pricePaise) };
}

/** Lowest / highest price across sizes (for "From ₹X" before a size is chosen). */
export function priceRange(base: { pricePaise: number; mrpPaise?: number }, options: SizeOption[] | undefined | null, sizes: string[] | undefined | null): { min: number; max: number; varies: boolean } {
  const prices = effectiveSizes(sizes).map((s) => priceForSize(base, options, s).pricePaise);
  const min = Math.min(...prices), max = Math.max(...prices);
  return { min, max, varies: min !== max };
}

/** Can this size be bought? `stockCount` undefined = not tracked per size. */
export function sizeAvailability(options: SizeOption[] | undefined | null, size: string | null | undefined, productInStock = true): { available: boolean; remaining?: number; low: boolean } {
  if (!productInStock) return { available: false, low: false };
  const stock = find(options, size)?.stockCount;
  if (stock === undefined) return { available: true, low: false };
  return { available: stock > 0, remaining: stock, low: stock > 0 && stock <= LOW_STOCK_THRESHOLD };
}

/** The storefront-safe view of the options (no raw counts). */
export function toPublicSizeOptions(options: SizeOption[] | undefined | null, sizes: string[] | undefined | null): PublicSizeOption[] {
  return effectiveSizes(sizes).map((size) => {
    const o = find(options, size);
    const a = sizeAvailability(options, size, true);
    return { size, ...(o?.pricePaise !== undefined ? { pricePaise: o.pricePaise } : {}), ...(o?.mrpPaise !== undefined ? { mrpPaise: o.mrpPaise } : {}), soldOut: !a.available, low: a.low };
  }).filter((p) => p.pricePaise !== undefined || p.mrpPaise !== undefined || p.soldOut || p.low);
}

/** Unit price × quantity (paise). Quantity is clamped to a sane range so a bad value can't produce nonsense. */
export function lineTotal(unitPaise: number, qty: number): number {
  const q = Math.min(Math.max(Math.floor(Number(qty) || 0), 0), 99);
  return Math.round(unitPaise) * q;
}

/** Percentage off MRP, rounded; 0 when there is no discount. */
export function discountPercent(pricePaise: number, mrpPaise: number): number {
  return mrpPaise > pricePaise && mrpPaise > 0 ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100) : 0;
}
