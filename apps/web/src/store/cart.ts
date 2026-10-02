/**
 * Cart Store — Zustand client-side cart state.
 *
 * Persists to localStorage via zustand/middleware (persist).
 * Cart items hold the minimum data needed for display + checkout.
 *
 * Money always stored in paise (integer).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  sku: string;
  size: string;
  color: string;
  pricePaise: number;
  mrpPaise?: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;

  /** Add or increment quantity of a cart item */
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;

  /** Add several items in ONE state update (one re-render, one storage write) */
  addItems: (items: Omit<CartItem, "quantity">[]) => void;

  /** Decrement quantity (removes item when qty reaches 0) */
  removeItem: (sku: string) => void;

  /** Set quantity directly */
  setQuantity: (sku: string, qty: number) => void;

  /** Empty the cart */
  clearCart: () => void;

  /** Total item count (sum of quantities) */
  totalItems: () => number;

  /** Total price in paise */
  totalPaise: () => number;

  /** Set applied coupon code */
  setCouponCode: (code: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,

      addItem: (incoming, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.sku === incoming.sku);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.sku === incoming.sku
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...incoming, quantity: qty }] };
        }),

      addItems: (incoming) =>
        set((state) => {
          const items = [...state.items];
          for (const inc of incoming) {
            const i = items.findIndex((x) => x.sku === inc.sku);
            if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + 1 };
            else items.push({ ...inc, quantity: 1 });
          }
          return { items };
        }),

      removeItem: (sku) =>
        set((state) => ({
          items: state.items.filter((i) => i.sku !== sku),
        })),

      setQuantity: (sku, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.sku !== sku)
              : state.items.map((i) =>
                  i.sku === sku ? { ...i, quantity: qty } : i
                ),
        })),

      clearCart: () => set({ items: [], couponCode: null }),

      setCouponCode: (code) => set({ couponCode: code }),

      totalItems: () =>
        get().items.reduce((acc, i) => acc + i.quantity, 0),

      totalPaise: () =>
        get().items.reduce(
          (acc, i) => acc + i.pricePaise * i.quantity,
          0
        ),
    }),
    {
      name: "cultraven-cart",
      // Rehydrated after mount by <StoreRehydrator/> so the first client render matches the server HTML.
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
