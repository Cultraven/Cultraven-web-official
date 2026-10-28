import { describe, it, expect } from "vitest";
import { PAGE_BANNER_PAGES, SECTION_MAP, validateFields } from "./cms/registry";

describe("page banners (admin section)", () => {
  const def = SECTION_MAP["site.pageBanners"];
  it("exists in the Pages group and lists every inner page that has a heading strip", () => {
    expect(def.group).toBe("Pages");
    expect(PAGE_BANNER_PAGES.map((p) => p.slug)).toEqual(expect.arrayContaining(["our-heritage", "lookbook", "journal", "contact", "size-guide", "terms", "privacy", "shipping", "returns"]));
  });
  it("accepts a photo, a darkness level and optional text, and keeps an empty banner empty", () => {
    const ok = validateFields(def.fields, { items: [
      { id: "a", page: "our-heritage", image: "https://images.unsplash.com/photo-1?w=900", overlay: 70, eyebrow: "CULTRAVEN", title: "Our Story", subtitle: "Hi", active: true },
      { id: "b", page: "contact", image: "", overlay: 55, eyebrow: "", title: "", subtitle: "", active: true },
    ] });
    expect(ok.errors).toEqual([]);
    const items: any[] = ok.value.items as any[];
    expect(items[0].overlay).toBe(70);
    expect(items[1].image).toBe("");
  });
  it("clamps the darkness to 0-90, refuses an unknown page and an unsafe image address", () => {
    const hi: any = validateFields(def.fields, { items: [{ page: "contact", overlay: 500 }] });
    expect(hi.value.items[0].overlay).toBe(90);
    expect(validateFields(def.fields, { items: [{ page: "not-a-page" }] }).value).toBeTruthy();
    expect(validateFields(def.fields, { items: [{ page: "contact", image: "javascript:alert(1)" }] }).errors.length).toBeGreaterThan(0);
  });
});
