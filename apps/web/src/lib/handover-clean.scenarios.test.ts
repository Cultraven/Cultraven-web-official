/**
 * Hand-over safety: nothing in the repo can put sample/dummy shop data back into the live database,
 * and every social page is managed from one place in the admin.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SECTIONS } from "@/lib/cms/registry";

const web = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(web, rel), "utf8");

describe("seed script (pnpm db:seed)", () => {
  const seed = read("scripts/seed-cms.mjs");

  it("seeds no sample products, sample Shop the look or sample reviews/orders", () => {
    expect(seed).not.toMatch(/collection\("products"\)/);
    expect(seed).not.toMatch(/collection\("shoplooks"\)\.insert/);
    expect(seed).not.toMatch(/collection\("(reviews|orders)"\)/);
    expect(seed).not.toMatch(/unsplash\.com\/photo-[^"`]*"[^]*pricePaise/); // no priced demo items
  });

  it("has none of the invented drop names or fake community / trending content", () => {
    for (const bad of ["Dharma", "dharma", "Dragon Blood", "dragon-blood", "Acid State", "acid-state", "Lava Stripe", "lava-stripe", "Core Essentials"]) expect(seed).not.toContain(bad);
    expect(seed).toMatch(/"home\.trending": \{ heading: "Trending Now", items: \[\] \}/);
    expect(seed).toMatch(/"home\.community": \{[^}]*items: \[\],?\s*\}/);
    expect(seed).not.toMatch(/From ₹/);
  });

  it("seeds the Social links section", () => {
    expect(seed).toContain('"site.social"');
  });
});

describe("scripts that could wipe or invent shop data are gone", () => {
  it.each(["scripts/seed.ts", "scripts/seed-size-prices.mjs"])("%s does not exist", (f) => {
    expect(fs.existsSync(path.join(web, f))).toBe(false);
  });
});

describe("admin", () => {
  it("the products page no longer suggests loading sample data", () => {
    expect(read("src/app/(admin)/portal-secure/products/page.tsx")).not.toMatch(/sample data|db:seed/i);
  });

  it("has a Social links section, and the Footer section no longer hides a second copy of the list", () => {
    const social = SECTIONS.find((s) => s.key === "site.social");
    expect(social?.label).toBe("Social links");
    const list: any = social!.fields.find((f: any) => f.key === "items");
    expect(list.fields.map((f: any) => f.key)).toEqual(["platform", "href", "active"]);
    expect(list.fields[0].options).toEqual(expect.arrayContaining(["instagram", "twitter", "facebook", "reddit"]));
    const footer = SECTIONS.find((s) => s.key === "site.footer")!;
    expect(footer.fields.some((f: any) => f.key === "socialLinks")).toBe(false);
  });
});
