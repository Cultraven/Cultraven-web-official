import { describe, it, expect } from "vitest";
import { productsForCollection, type CollectionProduct } from "./collection-products";
import { SECTION_MAP, validateFields } from "./cms/registry";

const P = (slug: string, over: Partial<CollectionProduct> = {}): CollectionProduct => ({ slug, category: "tees", mrpPaise: 100, pricePaise: 100, ...over });
const all = [P("tee-a"), P("hoodie-a", { category: "hoodies" }), P("cargo-a", { category: "bottoms" }), P("new-b", { isNewArrival: true }), P("best-c", { isBestseller: true }), P("sale-d", { mrpPaise: 200 }), P("badge-e", { badge: "LIMITED" })];

describe("which products a collection page shows", () => {
  it("all shows everything; new-in, bestsellers and sale use the product's own flags", () => {
    expect(productsForCollection(all, "all")).toHaveLength(all.length);
    expect(productsForCollection(all, "new-in").map((p) => p.slug)).toEqual(["new-b", "badge-e"]);
    expect(productsForCollection(all, "bestsellers").map((p) => p.slug)).toEqual(["best-c"]);
    expect(productsForCollection(all, "sale").map((p) => p.slug)).toEqual(["sale-d"]);
  });
  it("a collection shows exactly the products the admin ticked, whatever their category", () => {
    expect(productsForCollection(all, "cargos", ["cargo-a", "tee-a"]).map((p) => p.slug)).toEqual(["tee-a", "cargo-a"]);
    expect(productsForCollection(all, "dharma", ["hoodie-a"]).map((p) => p.slug)).toEqual(["hoodie-a"]);
  });
  it("with nothing ticked it falls back to products whose category matches the page address", () => {
    expect(productsForCollection(all, "hoodies").map((p) => p.slug)).toEqual(["hoodie-a"]);
    expect(productsForCollection(all, "HOODIES").map((p) => p.slug)).toEqual(["hoodie-a"]);
    expect(productsForCollection(all, "outerwear")).toEqual([]);
  });
  it("ticked products that no longer exist are simply ignored", () => {
    expect(productsForCollection(all, "x", ["ghost"])).toEqual([]);
  });
});

describe("the Collections admin form", () => {
  const def = SECTION_MAP["shop.collections"];
  it("saves the ticked products, removes duplicates and drops anything that is not a product address", () => {
    const r: any = validateFields(def.fields, { items: [{ slug: "cargos", name: "Cargos", image: "https://images.unsplash.com/photo-1?w=900", products: ["a-1", "a-1", " b_2 ", "bad slug!", 5, "<script>"], active: true }] });
    expect(r.errors).toEqual([]);
    expect(r.value.items[0].products).toEqual(["a-1", "b_2"]);
  });
  it("a collection with no products saved still validates (it then uses its category)", () => {
    const r: any = validateFields(def.fields, { items: [{ slug: "tees", name: "Tees", image: "https://images.unsplash.com/photo-1?w=900" }] });
    expect(r.errors).toEqual([]);
    expect(r.value.items[0].products).toEqual([]);
  });
});
