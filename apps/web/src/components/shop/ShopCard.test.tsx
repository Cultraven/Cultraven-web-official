import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));
vi.mock("@/components/common/CmsImage", () => ({ default: ({ src, alt, fill: _f, priority: _p, ...rest }: any) => <img src={src} alt={alt} {...rest} /> }));

import { ShopCard, ShopCardSkeleton } from "./ShopCard";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import type { CardProduct } from "@/lib/card-info";

const product: CardProduct = {
  id: "p1", href: "/products/raven-shirt", title: "Men Regular Fit Checkered Shirt", image: "/a.jpg", hoverImage: "/b.jpg",
  pricePaise: 33300, mrpPaise: 99900, sizes: ["XXL", "3XL", "4XL", "5XL"], inStock: true,
};

beforeEach(() => { useCartStore.setState({ items: [], couponCode: null }); useWishlistStore.setState({ items: [] }); });
afterEach(() => cleanup());

describe("ShopCard", () => {
  it("shows brand, title, price, struck MRP, % off and the sizes in stock", () => {
    render(<ShopCard product={product} />);
    const card = screen.getByTestId("shop-card");
    expect(within(card).getByText("CULTRAVEN")).toBeTruthy();
    expect(within(card).getByText("Men Regular Fit Checkered Shirt")).toBeTruthy();
    expect(screen.getByTestId("sc-price").textContent).toBe("₹333");
    expect(within(card).getByText("₹999")).toBeTruthy();
    expect(screen.getByTestId("sc-off").textContent).toBe("67% off");
    expect(card.textContent).toContain("Size XXL, 3XL, 4XL, 5XL");
  });

  it("links the photo and the text to the product page", () => {
    render(<ShopCard product={product} />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs.every((h) => h === "/products/raven-shirt")).toBe(true);
  });

  it("no discount → no MRP, no '% off'", () => {
    render(<ShopCard product={{ ...product, mrpPaise: 33300 }} />);
    expect(screen.queryByTestId("sc-off")).toBeNull();
    expect(screen.queryByText("₹999")).toBeNull();
  });

  it("shows 'Only few left' only when a size in stock is low", () => {
    const { rerender } = render(<ShopCard product={product} />);
    expect(screen.queryByText("Only few left")).toBeNull();
    rerender(<ShopCard product={{ ...product, sizeOptions: [{ size: "XXL", soldOut: false, low: true }] }} />);
    expect(screen.getByText("Only few left")).toBeTruthy();
  });

  it("offers a size chip per size on hover and adds the chosen size at its own price", () => {
    render(<ShopCard product={{ ...product, sizes: ["M", "L", "XL"], pricePaise: 199900, mrpPaise: 299900, sizeOptions: [{ size: "XL", pricePaise: 219900, mrpPaise: 319900, soldOut: false, low: false }] }} />);
    const group = screen.getByRole("group", { name: /Add .* to bag/ });
    expect(within(group).getAllByRole("button").map((b) => b.textContent)).toEqual(["M", "L", "XL"]);
    fireEvent.click(within(group).getByRole("button", { name: "Add size XL to bag" }));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: "p1", slug: "raven-shirt", size: "XL", pricePaise: 219900, mrpPaise: 319900, quantity: 1 });
    expect(within(group).getByText("Added to bag ✓")).toBeTruthy();
    // same size again → same line, quantity 2; a different size → a second line
    fireEvent.click(within(group).getByRole("button", { name: "Add size XL to bag" }));
    fireEvent.click(within(group).getByRole("button", { name: "Add size M to bag" }));
    const after = useCartStore.getState().items;
    expect(after.find((i) => i.size === "XL")?.quantity).toBe(2);
    expect(after.find((i) => i.size === "M")?.pricePaise).toBe(199900);
  });

  it("uses the same bag line as the product page (slug-size-COLOUR sku)", () => {
    render(<ShopCard product={{ ...product, sizes: ["M"], colors: [{ hex: "#000000", label: "Jet Black" }] }} />);
    fireEvent.click(screen.getByRole("button", { name: "Add size M to bag" }));
    const item = useCartStore.getState().items[0];
    expect(item.sku).toBe("raven-shirt-M-JET-BLACK");
    expect(item.color).toBe("Jet Black");
  });

  it("sold-out sizes are disabled and can't be added", () => {
    render(<ShopCard product={{ ...product, sizes: ["M", "L"], sizeOptions: [{ size: "M", soldOut: true, low: false }] }} />);
    const m = screen.getByRole("button", { name: "Size M sold out" }) as HTMLButtonElement;
    expect(m.disabled).toBe(true);
    fireEvent.click(m);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByTestId("shop-card").textContent).toContain("Size L");
    expect(screen.getByTestId("shop-card").textContent).not.toContain("Size M,");
  });

  it("a product with no sizes is one 'Free Size' with a single add button", () => {
    render(<ShopCard product={{ ...product, sizes: [] }} />);
    expect(screen.getByText("Add to bag")).toBeTruthy();
    expect(screen.getByTestId("shop-card").textContent).toContain("Free Size");
    fireEvent.click(screen.getByRole("button", { name: "Add size Free Size to bag" }));
    expect(useCartStore.getState().items[0]).toMatchObject({ size: "Free Size", pricePaise: 33300 });
  });

  it("sizes with different prices show 'onwards'", () => {
    render(<ShopCard product={{ ...product, sizes: ["M", "XL"], pricePaise: 199900, mrpPaise: 299900, sizeOptions: [{ size: "XL", pricePaise: 219900, soldOut: false, low: false }] }} />);
    expect(screen.getByText("onwards")).toBeTruthy();
    expect(screen.getByTestId("sc-price").textContent).toBe("₹1,999");
  });

  it("out of stock: SOLD OUT tag, 'Currently unavailable', no size picker", () => {
    render(<ShopCard product={{ ...product, inStock: false }} />);
    expect(screen.getByText("SOLD OUT")).toBeTruthy();
    expect(screen.getByText("Currently unavailable")).toBeTruthy();
    expect(screen.queryByRole("group", { name: /to bag/ })).toBeNull();
    expect(screen.getByTestId("shop-card").getAttribute("data-sold-out")).toBe("true");
  });

  it("the heart saves to the wishlist and toggles back", () => {
    render(<ShopCard product={product} />);
    const heart = screen.getByRole("button", { name: "Add to wishlist" });
    expect(heart.getAttribute("aria-pressed")).toBe("false");
    act(() => { fireEvent.click(heart); });
    expect(useWishlistStore.getState().items.map((i) => i.id)).toEqual(["p1"]);
    expect(screen.getByRole("button", { name: "Remove from wishlist" }).getAttribute("aria-pressed")).toBe("true");
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Remove from wishlist" })); });
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  it("NEW tag for new arrivals, the admin's own badge wins", () => {
    const { rerender } = render(<ShopCard product={{ ...product, isNewArrival: true }} />);
    expect(screen.getByText("NEW")).toBeTruthy();
    rerender(<ShopCard product={{ ...product, isNewArrival: true, badge: "LIMITED" }} />);
    expect(screen.getByText("LIMITED")).toBeTruthy();
    expect(screen.queryByText("NEW")).toBeNull();
  });

  it("only renders the hover photo when there is a different second photo", () => {
    const { container, rerender } = render(<ShopCard product={product} />);
    expect(container.querySelectorAll("img").length).toBe(2);
    rerender(<ShopCard product={{ ...product, hoverImage: "/a.jpg" }} />);
    expect(container.querySelectorAll("img").length).toBe(1);
  });

  it("skeleton is hidden from assistive tech", () => {
    const { container } = render(<ShopCardSkeleton />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
