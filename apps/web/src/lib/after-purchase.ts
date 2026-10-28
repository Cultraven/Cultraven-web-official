/**
 * What happens to the shopper's cart once an order is placed.
 *  - Normal checkout: the whole cart was bought, so it is emptied.
 *  - BUY NOW (express): only that one item was bought. It is taken out of the cart too (by the amount bought), so a piece you
 *    had in the cart and then bought is not left there; everything else in the cart stays.
 * It runs once per order, so reloading the confirmation page later never touches a cart you have refilled.
 */
import { useCartStore } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";

const KEY = "cultraven-settled-orders";

function alreadyDone(orderId: string): boolean {
  try { return (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).includes(orderId); } catch { return false; }
}
function markDone(orderId: string) {
  try {
    const list = (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).filter((x) => x !== orderId);
    list.push(orderId);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-20)));
  } catch { /* storage blocked: the worst case is that a reload settles again */ }
}

/** Returns what it did, for tests and logging. */
export function settleCartAfterOrder(orderId: string): "cleared" | "removed-bought-item" | "already-done" {
  if (orderId && alreadyDone(orderId)) return "already-done";
  const express = useBuyNowStore.getState();
  const cart = useCartStore.getState();
  let result: "cleared" | "removed-bought-item";
  if (express.item) {
    const bought = express.item;
    const inCart = cart.items.find((i) => i.sku === bought.sku);
    if (inCart) cart.setQuantity(bought.sku, inCart.quantity - (bought.quantity || 1)); // 0 or less removes the line
    express.clear();
    result = "removed-bought-item";
  } else {
    cart.clearCart();
    result = "cleared";
  }
  if (orderId) markDone(orderId);
  return result;
}
