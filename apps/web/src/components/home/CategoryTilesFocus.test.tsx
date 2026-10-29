import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));
vi.mock("@/components/common/CmsImage", () => ({ default: (p: any) => <img alt={p.alt} src={String(p.src)} /> }));

import { CategoryTiles, TILE_FOCUS } from "./CategoryTiles";
import { SECTIONS, validateFields } from "@/lib/cms/registry";

afterEach(() => cleanup());

const tile = (over: Record<string, unknown> = {}) => ({ id: "t1", title: "Hoodies", href: "/collections/hoodies", image: "/uploads/a.jpg", size: "normal" as const, ...over });
const link = (container: HTMLElement) => container.querySelector("a.cat-tile") as HTMLElement;

describe("category tile photo focus", () => {
  it("Top / Middle / Bottom set which part of the photo stays in view", () => {
    for (const [choice, pos] of Object.entries(TILE_FOCUS)) {
      const { container, unmount } = render(<CategoryTiles strip={[]} tiles={[tile({ focus: choice })]} />);
      expect(link(container).style.getPropertyValue("--cat-pos")).toBe(pos);
      unmount();
    }
    expect(TILE_FOCUS.Bottom).toBe("50% 88%"); // trousers / shoes
    expect(TILE_FOCUS.Top).toBe("50% 12%"); // faces / hoods
  });

  it("Auto, empty or an unknown word leave the site's own default alone", () => {
    for (const focus of ["Auto", "", undefined, "sideways"]) {
      const { container, unmount } = render(<CategoryTiles strip={[]} tiles={[tile({ focus })]} />);
      expect(link(container).style.getPropertyValue("--cat-pos")).toBe("");
      unmount();
    }
  });

  it("the stylesheet reads the choice on desktop and on phones, with the old crops as the fallback", () => {
    const web = path.resolve(__dirname, "../..");
    expect(fs.readFileSync(path.join(web, "components/home/CategoryTiles.css"), "utf8")).toMatch(/\.cat-tile img \{ object-position: var\(--cat-pos, 50% 50%\); \}/);
    expect(fs.readFileSync(path.join(web, "styles/components.css"), "utf8")).toMatch(/\.cat-tile img \{ object-position: var\(--cat-pos, 50% 18%\) !important; \}/);
  });
});

describe("category tiles in the admin", () => {
  const sec = SECTIONS.find((s) => s.key === "home.categoryTiles")!;
  const items: any = (sec.fields.find((f: any) => f.key === "items") as any).fields;
  it("each tile has a 'Which part of the photo to show' choice that starts on Auto", () => {
    const f = items.find((x: any) => x.key === "focus");
    expect(f.label).toMatch(/which part of the photo/i);
    expect(f.options).toEqual(["Auto", "Top", "Middle", "Bottom"]);
    expect(f.default).toBe("Auto");
  });
  it("saves with a choice and does not keep a made-up one", () => {
    const base = { title: "Cargos", href: "/collections/cargos", image: "https://x/y.jpg", size: "normal" };
    expect(validateFields(items, { ...base, focus: "Bottom" }).errors).toEqual([]);
    expect(validateFields(items, { ...base, focus: "Sideways" }).value.focus).not.toBe("Sideways");
  });
});
