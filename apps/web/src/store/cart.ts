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
  quantity: number;
}

interface CartState {
  items: CartItem[];

  /** Add or increment quantity of a cart item */
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;

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
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

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

      removeItem: (sku) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.sku === sku ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0),
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

      clearCart: () => set({ items: [] }),

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
      storage: createJSONStorage(() => localStorage),
    }
  )
);
