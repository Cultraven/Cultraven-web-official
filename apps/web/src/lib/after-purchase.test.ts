// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { settleCartAfterOrder } from "./after-purchase";
import { useCartStore, type CartItem } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";

const item = (sku: string, quantity = 1): CartItem => ({ productId: "p-" + sku, slug: "s-" + sku, title: sku, image: "", sku, size: "XL", color: "Grey", pricePaise: 100, quantity });

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], couponCode: null });
  useBuyNowStore.setState({ item: null });
});

describe("the cart after an order is placed", () => {
  it("normal checkout empties the cart (and the coupon)", () => {
    useCartStore.setState({ items: [item("a"), item("b", 2)], couponCode: "SAVE10" });
    expect(settleCartAfterOrder("o1")).toBe("cleared");
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().couponCode).toBeNull();
  });
  it("BUY NOW of a piece that is also in the cart removes it from the cart and keeps everything else", () => {
    useCartStore.setState({ items: [item("grey-xl"), item("other")] });
    useBuyNowStore.setState({ item: item("grey-xl") });
    expect(settleCartAfterOrder("o2")).toBe("removed-bought-item");
    expect(useCartStore.getState().items.map((i) => i.sku)).toEqual(["other"]);
    expect(useBuyNowStore.getState().item).toBeNull();
  });
  it("BUY NOW of 1 when the cart holds 3 of it leaves 2; a piece not in the cart changes nothing", () => {
    useCartStore.setState({ items: [item("grey-xl", 3), item("other")] });
    useBuyNowStore.setState({ item: item("grey-xl", 1) });
    settleCartAfterOrder("o3");
    expect(useCartStore.getState().items.find((i) => i.sku === "grey-xl")?.quantity).toBe(2);
    useBuyNowStore.setState({ item: item("not-in-cart") });
    settleCartAfterOrder("o4");
    expect(useCartStore.getState().items.map((i) => i.sku).sort()).toEqual(["grey-xl", "other"]);
  });
  it("reloading the confirmation page does nothing the second time, so a cart you refilled is never emptied", () => {
    useBuyNowStore.setState({ item: item("grey-xl") });
    useCartStore.setState({ items: [item("grey-xl")] });
    settleCartAfterOrder("o5");
    useCartStore.setState({ items: [item("new-thing")] });
    expect(settleCartAfterOrder("o5")).toBe("already-done");
    expect(useCartStore.getState().items.map((i) => i.sku)).toEqual(["new-thing"]);
  });
});
