import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));

import { BrandStorySection } from "./BrandStorySection";
import { SECTIONS, validateFields } from "@/lib/cms/registry";

afterEach(() => cleanup());

const base = { eyebrow: "THE CULTURE", headline: "Clothes aren't just\nwhat you wear.", body: "Built for the generation that makes its own rules.", ctaLabel: "EXPLORE THE STORY", ctaHref: "/pages/our-heritage" };

describe("brand story banner", () => {
  it("with no photo and no video it shows the plain CULTRAVEN look (design grid + raven mark) and all the words", () => {
    const { container } = render(<BrandStorySection content={base} />);
    expect(container.querySelector(".bs-plain-grid")).not.toBeNull();
    const mark = container.querySelector("img.bs-plain-mark") as HTMLImageElement;
    expect(mark.getAttribute("src")).toBe("/brand/logo-mark"); // the logo the owner can replace in the admin
    expect(mark.getAttribute("alt")).toBe("");
    expect(container.querySelector("video")).toBeNull();
    expect(container.textContent).toContain("Clothes aren't just");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/pages/our-heritage");
  });

  it("an empty-string image and video (how the admin saves 'nothing') also gives the plain look", () => {
    const { container } = render(<BrandStorySection content={{ ...base, image: "", videoUrl: "" }} />);
    expect(container.querySelector(".bs-plain-grid")).not.toBeNull();
  });

  it("with a photo the photo is used and the plain look is not drawn", () => {
    const { container } = render(<BrandStorySection content={{ ...base, image: "https://x/y.jpg" }} />);
    expect(container.querySelector(".bs-plain-grid")).toBeNull();
    expect(container.querySelector('div[style*="y.jpg"]')).not.toBeNull();
  });

  it("with only a video, the video plays and the plain look is not drawn", () => {
    const { container } = render(<BrandStorySection content={{ ...base, videoUrl: "https://x/y.mp4" }} />);
    expect(container.querySelector("video")).not.toBeNull();
    expect(container.querySelector(".bs-plain-grid")).toBeNull();
  });
});

describe("brand story in the admin", () => {
  const story = SECTIONS.find((s) => s.key === "home.brandStory")!;
  it("the photo is optional, so the owner can leave it empty and save", () => {
    const { errors } = validateFields(story.fields, { headline: "Hello", image: "", videoUrl: "" });
    expect(errors).toEqual([]);
  });
  it("the headline is still required", () => {
    expect(validateFields(story.fields, { headline: "", image: "" }).errors.join(" ")).toMatch(/headline/i);
  });
});
