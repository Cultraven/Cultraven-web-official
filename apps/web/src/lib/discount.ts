/**
 * Admin discount offers. The admin gives a discount % on the MRP; the selling price is worked out from it.
 * Prices are whole rupees (what shoppers see and are charged), so "20% off ₹2,999" is exactly ₹2,399 and the
 * storefront's own "% off" (computed from price + MRP) reads back as 20%.
 */
import { discountPercent } from "./size-pricing";

export const MAX_DISCOUNT_PERCENT = 90;

/** Parse what the admin typed into a valid percentage (0–90, up to 2 decimals); null when it isn't a number. */
export function parseDiscountInput(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.min(Math.max(n, 0), MAX_DISCOUNT_PERCENT) * 100) / 100;
}

/** Selling price (paise) for an MRP and a discount %: rounded to a whole rupee, never below ₹1, never above the MRP. */
export function priceFromDiscount(mrpPaise: number, percent: number): number {
  const mrp = Math.max(0, Math.round(mrpPaise));
  const pct = Math.min(Math.max(Number.isFinite(percent) ? percent : 0, 0), MAX_DISCOUNT_PERCENT);
  if (mrp <= 0) return 0;
  const rupees = Math.round((mrp / 100) * (1 - pct / 100));
  return Math.min(mrp, Math.max(100, rupees * 100));
}

/** The % off a price/MRP pair shows (rounded to a whole number; 0 when there's no discount). */
export const percentOff = discountPercent;
