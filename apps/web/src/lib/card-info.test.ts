import { describe, expect, it } from "vitest";
import { cardView, isFreeSizeOnly, slugFromHref, type CardProduct } from "./card-info";

const base: CardProduct = { id: "p1", href: "/products/raven-tee", title: "Raven Tee", image: "/a.jpg", pricePaise: 33300, mrpPaise: 99900, sizes: ["XXL", "3XL", "4XL", "5XL"], inStock: true };

describe("cardView", () => {
  it("shows price, MRP and the rounded % off (the ₹333 / ₹999 / 66% card)", () => {
    const v = cardView(base);
    expect(v.pricePaise).toBe(33300);
    expect(v.mrpPaise).toBe(99900);
    expect(v.off).toBe(67);
    expect(v.varies).toBe(false);
  });

  it("lists the sizes in stock as one line", () => {
    expect(cardView(base).sizeLabel).toBe("XXL, 3XL, 4XL, 5XL");
  });

  it("leaves sold-out sizes out of the line and flags nothing else", () => {
    const v = cardView({ ...base, sizeOptions: [{ size: "3XL", soldOut: true, low: false }] });
    expect(v.sizeLabel).toBe("XXL, 4XL, 5XL");
    expect(v.soldOut).toBe(false);
    expect(v.fewLeft).toBe(false);
  });

  it("'Only few left' when any in-stock size is low", () => {
    expect(cardView({ ...base, sizeOptions: [{ size: "XXL", soldOut: false, low: true }] }).fewLeft).toBe(true);
  });

  it("a sold-out size being low doesn't count as few left", () => {
    expect(cardView({ ...base, sizeOptions: [{ size: "XXL", soldOut: true, low: true }] }).fewLeft).toBe(false);
  });

  it("admin LOW STOCK badge also means few left, and isn't repeated as a photo tag", () => {
    const v = cardView({ ...base, badge: "LOW STOCK" });
    expect(v.fewLeft).toBe(true);
    expect(v.badge).toBe("");
  });

  it("uses the lowest price among sizes you can buy, marked as 'varies'", () => {
    const v = cardView({ ...base, sizes: ["M", "L", "XL"], pricePaise: 199900, mrpPaise: 299900, sizeOptions: [{ size: "XL", pricePaise: 219900, mrpPaise: 319900, soldOut: false, low: false }] });
    expect(v.pricePaise).toBe(199900);
    expect(v.varies).toBe(true);
    // if the cheaper sizes are gone, the price of what's left is shown
    const w = cardView({ ...base, sizes: ["M", "XL"], pricePaise: 199900, mrpPaise: 299900, sizeOptions: [{ size: "M", soldOut: true, low: false }, { size: "XL", pricePaise: 219900, mrpPaise: 319900, soldOut: false, low: false }] });
    expect(w.pricePaise).toBe(219900);
    expect(w.mrpPaise).toBe(319900);
    expect(w.sizeLabel).toBe("XL");
  });

  it("no sizes → one 'Free Size'", () => {
    const v = cardView({ ...base, sizes: [] });
    expect(v.sizeLabel).toBe("Free Size");
    expect(isFreeSizeOnly(v.sizes)).toBe(true);
    expect(isFreeSizeOnly(cardView(base).sizes)).toBe(false);
  });

  it("out of stock: SOLD OUT tag, no sizes, no 'few left'", () => {
    const v = cardView({ ...base, inStock: false, badge: "LOW STOCK" });
    expect(v.soldOut).toBe(true);
    expect(v.badge).toBe("SOLD OUT");
    expect(v.sizeLabel).toBe("");
    expect(v.fewLeft).toBe(false);
  });

  it("every size sold out → sold out", () => {
    const v = cardView({ ...base, sizes: ["M", "L"], sizeOptions: [{ size: "M", soldOut: true, low: false }, { size: "L", soldOut: true, low: false }] });
    expect(v.soldOut).toBe(true);
  });

  it("badge priority: the admin's badge, then NEW", () => {
    expect(cardView({ ...base, badge: "LIMITED", isNewArrival: true }).badge).toBe("LIMITED");
    expect(cardView({ ...base, isNewArrival: true }).badge).toBe("NEW");
    expect(cardView(base).badge).toBe("");
  });

  it("no MRP → no discount", () => {
    const v = cardView({ ...base, mrpPaise: undefined });
    expect(v.off).toBe(0);
    expect(v.mrpPaise).toBe(v.pricePaise);
  });
});

describe("slugFromHref", () => {
  it("takes the slug off a product link", () => {
    expect(slugFromHref("/products/dharma-graphic-hoodie-stone")).toBe("dharma-graphic-hoodie-stone");
    expect(slugFromHref("/products/x?ref=1")).toBe("x");
  });
});
