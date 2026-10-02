import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WishItem {
  id: string;
  title: string;
  href: string;
  image: string;
  pricePaise: number;
  mrpPaise?: number;
}

interface WishlistState {
  items: WishItem[];
  toggle: (item: WishItem) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
}

/** Wishlist lives in the visitor's browser (localStorage), like the cart — no account required. */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((s) => (s.items.some((i) => i.id === item.id) ? { items: s.items.filter((i) => i.id !== item.id) } : { items: [item, ...s.items].slice(0, 100) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "cultraven-wishlist", skipHydration: true, storage: createJSONStorage(() => localStorage) }
  )
);

/** [isWishlisted, toggle] for one product — re-renders only when this product's state changes. */
export function useWishlisted(item: WishItem): [boolean, () => void] {
  const on = useWishlistStore((s) => s.items.some((i) => i.id === item.id));
  const toggle = useWishlistStore((s) => s.toggle);
  return [on, () => toggle(item)];
}
