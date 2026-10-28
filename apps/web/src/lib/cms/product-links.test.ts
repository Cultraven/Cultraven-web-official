import { describe, it, expect } from "vitest";
import { productSlugsIn } from "./product-links";
import { SECTION_MAP } from "./registry";

describe("links to products inside CMS sections", () => {
  it("finds every /products/<slug> link at any depth", () => {
    const v = { heading: "x", items: [{ href: "/products/dharma-ep01-hoodie" }, { href: "/collections/all" }, { nested: { link: "/products/real-tee?size=M" } }, { href: "https://x.co/products/no" }] };
    expect(productSlugsIn(v)).toEqual(["dharma-ep01-hoodie", "real-tee"]);
  });
  it("ignores everything that is not a product link, and handles odd input", () => {
    expect(productSlugsIn(null)).toEqual([]);
    expect(productSlugsIn("/products/")).toEqual([]);
    expect(productSlugsIn(["/products/%E0%A4%A"])).toEqual(["%E0%A4%A"]);
  });
  it("the Trending cards offer 'fill from a product' for their title, link, image and alt text", () => {
    const list: any = SECTION_MAP["home.trending"].fields.find((f) => f.kind === "list");
    expect(list.productFill).toEqual({ title: "title", href: "href", image: "image", alt: "alt" });
  });
});
