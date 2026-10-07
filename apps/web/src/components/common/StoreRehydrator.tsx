"use client";
import { useLayoutEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useBuyNowStore } from "@/store/buyNow";

/**
 * The cart, wishlist and express-checkout stores persist to the browser. Hydrating them at module load made the
 * first client render differ from the server HTML (hydration warnings for any visitor with a non-empty cart).
 * They are created with `skipHydration` and restored here, right after hydration and before paint.
 */
export function StoreRehydrator() {
  useLayoutEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
    void useBuyNowStore.persist.rehydrate();
  }, []);
  return null;
}
