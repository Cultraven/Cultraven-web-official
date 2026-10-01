/**
 * Buy-Now store — the single item behind "COP IT NOW".
 *
 * Kept apart from the cart so an express purchase never touches (or empties) what the shopper
 * already bagged. Lives in sessionStorage: it survives the checkout redirect and a refresh,
 * but not a new tab.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "./cart";

interface BuyNowState {
  item: CartItem | null;
  set: (item: CartItem) => void;
  clear: () => void;
}

export const useBuyNowStore = create<BuyNowState>()(
  persist(
    (set) => ({
      item: null,
      set: (item) => set({ item }),
      clear: () => set({ item: null }),
    }),
    { name: "cultraven-buy-now", storage: createJSONStorage(() => sessionStorage) }
  )
);
