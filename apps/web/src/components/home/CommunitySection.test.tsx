import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));
vi.mock("@/components/common/CmsImage", () => ({ default: (p: any) => <img alt={p.alt} src={String(p.src)} /> }));

import { CommunitySection, instagramHandle, safeInstagramLink } from "./CommunitySection";
import { SECTIONS, validateFields } from "@/lib/cms/registry";

afterEach(() => cleanup());

const content = { heading: "Worn by the culture", instagramUrl: "https://www.instagram.com/cultraven._/" };

describe("Instagram handle and post links", () => {
  it("reads the @handle from the profile address", () => {
    expect(instagramHandle("https://www.instagram.com/cultraven._/")).toBe("@CULTRAVEN._");
    expect(instagramHandle("https://instagram.com/someone")).toBe("@SOMEONE");
  });
  it("falls back to @CULTRAVEN for anything that is not a profile address", () => {
    for (const u of [undefined, "", "not a url", "http://www.instagram.com/x/", "https://example.com/cultraven", "https://www.instagram.com/p/AbC123/", "javascript:alert(1)"]) expect(instagramHandle(u)).toBe("@CULTRAVEN");
  });
  it("only https links on instagram.com are allowed on a photo", () => {
    expect(safeInstagramLink("https://www.instagram.com/p/AbC123/")).toBe("https://www.instagram.com/p/AbC123/");
    for (const u of [undefined, "", "javascript:alert(1)", "http://www.instagram.com/p/x/", "https://evil.example/p/x/", "https://instagram.com.evil.example/p/x/", "data:text/html,hi"]) expect(safeInstagramLink(u)).toBe("");
  });
});

describe("Community photos", () => {
  it("a photo with an Instagram post link opens that post in a new tab; one without is a plain picture", () => {
    render(
      <CommunitySection
        content={content}
        images={[
          { id: "1", src: "https://x/1.jpg", alt: "Coming soon post one", href: "https://www.instagram.com/p/AbC123/" },
          { id: "2", src: "https://x/2.jpg", alt: "Coming soon post two", href: "javascript:alert(1)" },
        ]}
      />
    );
    const link = screen.getByRole("link", { name: /view this post on instagram: coming soon post one/i }) as HTMLAnchorElement;
    expect(link.href).toBe("https://www.instagram.com/p/AbC123/");
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
    expect(screen.queryByRole("link", { name: /coming soon post two/i })).toBeNull();
    expect(screen.getByAltText("Coming soon post two")).toBeTruthy();
  });

  it("shows the real @handle (not a made-up one) in the header link and on the tiles", () => {
    const { container } = render(<CommunitySection content={content} images={[{ id: "1", src: "https://x/1.jpg", alt: "a" }]} />);
    expect(screen.getAllByText("@CULTRAVEN._").length).toBeGreaterThanOrEqual(2);
    expect(container.textContent).not.toMatch(/@CULTRAVEN(?!\._)/);
  });

  it("the grid tells the stylesheet how many photos there are (1 to 5 get their own layout, 6 or more use the bento)", () => {
    const imgs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), src: `https://x/${i}.jpg`, alt: `p${i}` }));
    for (const [n, expected] of [[1, "1"], [2, "2"], [5, "5"], [6, "6"], [9, "6"]] as const) {
      const { container, unmount } = render(<CommunitySection content={content} images={imgs(n)} />);
      expect(container.querySelector(".ugc-grid")?.getAttribute("data-count")).toBe(expected);
      expect(container.querySelectorAll(".ugc-grid > *")).toHaveLength(n);
      unmount();
    }
  });
});

describe("Community in the admin", () => {
  const community = SECTIONS.find((s) => s.key === "home.community")!;
  const items = (community.fields.find((f: any) => f.key === "items") as any).fields;

  it("each photo has an optional Instagram post link", () => {
    expect(items.some((f: any) => f.key === "href" && f.kind === "url" && !f.required)).toBe(true);
  });
  it("accepts a post link or none, and refuses a link that is not https", () => {
    const base = { image: "https://x/y.jpg", alt: "a" };
    expect(validateFields(items, { ...base, href: "https://www.instagram.com/p/AbC123/" }).errors).toEqual([]);
    expect(validateFields(items, base).errors).toEqual([]);
    expect(validateFields(items, { ...base, href: "http://www.instagram.com/p/AbC123/" }).errors.length).toBeGreaterThan(0);
    expect(validateFields(items, { ...base, href: "javascript:alert(1)" }).errors.length).toBeGreaterThan(0);
  });
});
