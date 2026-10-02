/**
 * "Please review what you received": which delivered items a customer hasn't reviewed yet, and the dismissal rules
 * for the popup. Pure helpers (the API route and the popup both use them, and the tests cover them without a database).
 */

export interface PendingItem { productId: string; slug: string; title: string; image: string; orderNumber: string; size: string }
export const PENDING_LIMIT = 3;
/** Only recent deliveries are worth asking about. */
export const PENDING_WINDOW_DAYS = 90;
const DAY = 86_400_000;

export interface OrderLike {
  _id: unknown;
  fulfillmentStatus: string;
  deliveredAt?: Date | string | null;
  items?: { productId?: string; size?: string }[];
}

/** Newest delivered orders first; each product once; reviewed or missing products skipped. */
export function buildPending(
  orders: OrderLike[],
  reviewed: Set<string>,
  products: Map<string, { slug: string; title: string; image: string }>,
  now = Date.now(),
  limit = PENDING_LIMIT
): PendingItem[] {
  const out: PendingItem[] = [];
  const seen = new Set<string>();
  const delivered = orders
    .filter((o) => o.fulfillmentStatus === "delivered" && o.deliveredAt && now - new Date(o.deliveredAt).getTime() <= PENDING_WINDOW_DAYS * DAY)
    .sort((a, b) => new Date(b.deliveredAt as any).getTime() - new Date(a.deliveredAt as any).getTime());
  for (const o of delivered) {
    for (const it of o.items ?? []) {
      const pid = String(it.productId ?? "");
      if (!pid || seen.has(pid) || reviewed.has(pid)) continue;
      const p = products.get(pid);
      if (!p) continue;
      seen.add(pid);
      out.push({ productId: pid, slug: p.slug, title: p.title, image: p.image, orderNumber: `CR-${String(o._id).slice(-6).toUpperCase()}`, size: String(it.size ?? "") });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ── popup memory (browser) ──────────────────────────────────────────────────────

export type DismissMap = Record<string, number>; // productId -> time until which we stay quiet
export const LATER_DAYS = 3;   // "Maybe later"
export const SKIP_DAYS = 45;   // "Don't ask for this item"

export function isQuiet(map: DismissMap | null | undefined, productId: string, now = Date.now()): boolean {
  const until = map?.[productId];
  return typeof until === "number" && until > now;
}

export function withDismissal(map: DismissMap | null | undefined, productId: string, days: number, now = Date.now()): DismissMap {
  const next: DismissMap = {};
  for (const [k, v] of Object.entries(map ?? {})) if (typeof v === "number" && v > now) next[k] = v; // forget expired entries
  next[productId] = now + days * DAY;
  return next;
}

/** First pending item that hasn't been snoozed. */
export function nextToAsk(items: PendingItem[], map: DismissMap | null | undefined, now = Date.now()): PendingItem | null {
  return items.find((i) => !isQuiet(map, i.productId, now)) ?? null;
}

/** Paths where an interruption would be unwelcome (payment, forms, admin) or pointless (already on that product's reviews). */
export function promptAllowedOn(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/checkout") || pathname.startsWith("/order-success") || pathname.startsWith("/portal-") || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password")) return false;
  return true;
}
