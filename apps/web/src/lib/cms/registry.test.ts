import { describe, it, expect } from "vitest";
import { SECTIONS, SECTION_MAP, validateFields, liveItems } from "./registry";

describe("CMS registry validation", () => {
  it("every section validates an empty object without throwing and yields defaults", () => {
    for (const s of SECTIONS) {
      const { value } = validateFields(s.fields, {});
      expect(typeof value).toBe("object");
    }
  });

  it("rejects javascript: links, http images and missing required fields", () => {
    const def = SECTION_MAP["home.trending"];
    const bad = { heading: "x", items: [{ title: "", href: "javascript:alert(1)", image: "http://x.test/a.jpg" }] };
    const { errors } = validateFields(def.fields, bad);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accepts https images and uploaded files, assigns stable ids, drops unknown keys", () => {
    const def = SECTION_MAP["home.trending"];
    const { value, errors } = validateFields(def.fields, {
      heading: "Trending",
      evil: "<script>",
      items: [{ title: "A", href: "/p/a", image: "/uploads/0123456789abcdef0123456789abcdef.png", alt: "", active: true }],
    });
    expect(errors).toEqual([]);
    expect((value as any).evil).toBeUndefined();
    expect((value as any).items[0].id).toMatch(/^[\w-]{1,40}$/);
  });

  it("enforces list size limits", () => {
    const def = SECTION_MAP["home.trending"];
    const items = Array.from({ length: 30 }, (_, i) => ({ title: "t" + i, href: "/x", image: "https://a.test/i.jpg" }));
    expect(validateFields(def.fields, { heading: "h", items }).errors.length).toBeGreaterThan(0);
  });

  it("liveItems filters inactive and out-of-schedule entries (order preserved)", () => {
    const now = Date.parse("2026-06-01T00:00:00Z");
    const out = liveItems(
      [
        { id: "a", active: true },
        { id: "b", active: false },
        { id: "c", active: true, endAt: "2026-05-01T00:00:00Z" },
        { id: "d", active: true, startAt: "2026-07-01T00:00:00Z" },
        { id: "e", active: true, startAt: "2026-05-01T00:00:00Z", endAt: "2026-07-01T00:00:00Z" },
      ] as any,
      now
    ) as any[];
    expect(out.map((x) => x.id)).toEqual(["a", "e"]);
  });
});
