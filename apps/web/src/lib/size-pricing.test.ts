import { describe, it, expect } from "vitest";
import { FREE_SIZE, effectiveSizes, normalizeSizeOptions, priceForSize, priceRange, sizeAvailability, toPublicSizeOptions, lineTotal, discountPercent } from "./size-pricing";

const base = { pricePaise: 199900, mrpPaise: 299900 };
const sizes = ["S", "M", "L", "XL"];
const opts = [{ size: "XL", pricePaise: 219900, mrpPaise: 319900 }, { size: "S", stockCount: 0 }, { size: "M", stockCount: 3 }];

describe("effectiveSizes", () => {
  it("keeps real sizes, de-duplicated and trimmed", () => expect(effectiveSizes([" S ", "M", "S", ""])).toEqual(["S", "M"]));
  it("falls back to Free Size when a product has none (fixes the empty size selector)", () => {
    expect(effectiveSizes([])).toEqual([FREE_SIZE]);
    expect(effectiveSizes(undefined)).toEqual([FREE_SIZE]);
    expect(effectiveSizes(["", "  "])).toEqual([FREE_SIZE]);
  });
});

describe("normalizeSizeOptions", () => {
  it("drops unknown sizes, duplicates, junk and no-op entries", () => {
    const r = normalizeSizeOptions([{ size: "XL", pricePaise: 219900 }, { size: "XL", pricePaise: 1 }, { size: "XXXL", pricePaise: 5 }, { size: "M" }, null, "x", { size: "S", stockCount: 0 }], sizes);
    expect(r).toEqual([{ size: "XL", pricePaise: 219900 }, { size: "S", stockCount: 0 }]);
  });
  it("rejects non-numbers, negatives and zero prices; keeps zero stock", () => {
    expect(normalizeSizeOptions([{ size: "M", pricePaise: "199" as any, stockCount: -1 }, { size: "L", pricePaise: 0 }, { size: "S", stockCount: 0 }], sizes)).toEqual([{ size: "S", stockCount: 0 }]);
  });
  it("returns [] for non-arrays", () => { for (const v of [null, undefined, {}, "x", 5]) expect(normalizeSizeOptions(v, sizes)).toEqual([]); });
  it("works for Free Size products", () => expect(normalizeSizeOptions([{ size: FREE_SIZE, pricePaise: 100 }], [])).toEqual([{ size: FREE_SIZE, pricePaise: 100 }]));
});

describe("priceForSize", () => {
  it("uses the base price unless a size overrides it", () => {
    expect(priceForSize(base, opts, "M")).toEqual({ pricePaise: 199900, mrpPaise: 299900 });
    expect(priceForSize(base, opts, "XL")).toEqual({ pricePaise: 219900, mrpPaise: 319900 });
    expect(priceForSize(base, opts, null)).toEqual({ pricePaise: 199900, mrpPaise: 299900 });
    expect(priceForSize(base, undefined, "L")).toEqual({ pricePaise: 199900, mrpPaise: 299900 });
  });
  it("never lets the MRP fall below the selling price", () => {
    expect(priceForSize({ pricePaise: 100, mrpPaise: 150 }, [{ size: "XL", pricePaise: 500 }], "XL")).toEqual({ pricePaise: 500, mrpPaise: 500 });
  });
});

describe("priceRange", () => {
  it("reports From price when sizes differ", () => expect(priceRange(base, opts, sizes)).toEqual({ min: 199900, max: 219900, varies: true }));
  it("is flat when nothing overrides", () => expect(priceRange(base, [], sizes)).toEqual({ min: 199900, max: 199900, varies: false }));
});

describe("sizeAvailability", () => {
  it("untracked sizes are available; zero stock is sold out; low stock is flagged", () => {
    expect(sizeAvailability(opts, "L")).toEqual({ available: true, low: false });
    expect(sizeAvailability(opts, "S")).toMatchObject({ available: false, remaining: 0 });
    expect(sizeAvailability(opts, "M")).toMatchObject({ available: true, remaining: 3, low: true });
  });
  it("a sold-out product makes every size unavailable", () => expect(sizeAvailability(opts, "XL", false).available).toBe(false));
});

describe("toPublicSizeOptions", () => {
  it("hides raw stock counts and omits sizes with nothing special", () => {
    const p = toPublicSizeOptions(opts, sizes);
    expect(p).toEqual([{ size: "S", soldOut: true, low: false }, { size: "M", soldOut: false, low: true }, { size: "XL", pricePaise: 219900, mrpPaise: 319900, soldOut: false, low: false }]);
    expect(JSON.stringify(p)).not.toContain("stockCount");
  });
});

describe("lineTotal / discountPercent", () => {
  it("scales with quantity", () => { expect(lineTotal(199900, 1)).toBe(199900); expect(lineTotal(199900, 3)).toBe(599700); });
  it("clamps silly quantities", () => { expect(lineTotal(100, -5)).toBe(0); expect(lineTotal(100, 1e9)).toBe(9900); expect(lineTotal(100, NaN as any)).toBe(0); });
  it("computes percent off", () => { expect(discountPercent(199900, 299900)).toBe(33); expect(discountPercent(299900, 299900)).toBe(0); expect(discountPercent(1, 0)).toBe(0); });
});
