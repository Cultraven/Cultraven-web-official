/**
 * Which products a /collections/<slug> page shows.
 *  - all: everything          - new-in: new arrivals          - bestsellers: bestsellers          - sale: anything with a discount
 *  - any other collection: the products the admin ticked for it (Admin -> Website content -> Collections);
 *    if none are ticked, the products whose category matches the slug (the old behaviour).
 */
export interface CollectionProduct { slug: string; category: string; badge?: string; mrpPaise: number; pricePaise: number; isNewArrival?: boolean; isBestseller?: boolean }

export function productsForCollection<T extends CollectionProduct>(products: T[], slug: string, picked: string[] = []): T[] {
  const s = (slug || "").toLowerCase();
  if (s === "all" || !s) return products;
  if (s === "new-in") return products.filter((p) => p.isNewArrival || p.badge === "NEW" || p.badge === "LIMITED");
  if (s === "bestsellers") return products.filter((p) => p.isBestseller || p.badge === "BESTSELLER");
  if (s === "sale") return products.filter((p) => p.mrpPaise > p.pricePaise);
  if (picked.length) {
    const set = new Set(picked);
    return products.filter((p) => set.has(p.slug));
  }
  return products.filter((p) => (p.category || "").toLowerCase() === s);
}
