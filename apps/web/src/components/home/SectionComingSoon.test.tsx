import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));
vi.mock("@/components/common/CmsImage", () => ({ default: (p: any) => <img alt={p.alt} src={String(p.src)} /> }));
vi.mock("@/components/shop/ShopCard", () => ({ ShopCard: ({ product }: any) => <div data-testid="card">{product.title}</div> }));

import { NewDropSection } from "./NewDropSection";
import { BestsellersSection } from "./BestsellersSection";
import { TrendingNow } from "./TrendingNow";
import { CommunitySection } from "./CommunitySection";
import { ShopTheLookSection } from "./ShopTheLookSection";

afterEach(() => cleanup());

describe("home sections with nothing in them yet say 'coming soon'", () => {
  it("New Drop, Bestsellers, Trending, Community and Shop the Look each show a coming-soon panel with their own heading", () => {
    const { container } = render(
      <>
        <NewDropSection content={{ heading: "New Arrivals", eyebrow: "Just in" }} products={[]} />
        <BestsellersSection content={{ heading: "Best Sellers" }} products={[]} />
        <TrendingNow heading="Trending Now" items={[]} />
        <CommunitySection content={{ heading: "Worn by the culture" }} images={[]} />
        <ShopTheLookSection look={null} />
      </>
    );
    expect(screen.getAllByText("Coming soon")).toHaveLength(5);
    for (const h of ["New Arrivals", "Best Sellers", "Trending Now", "Worn by the culture", "Shop The Look"]) expect(screen.getByRole("heading", { name: h })).toBeTruthy();
    expect(container.querySelectorAll("[data-testid=card]")).toHaveLength(0);
  });
  it("as soon as there is something to show, no coming-soon panel appears", () => {
    render(
      <>
        <TrendingNow heading="Trending Now" items={[{ id: "1", title: "Real tee", href: "/products/real-tee", image: "https://x/y.jpg" }]} />
        <CommunitySection content={{ heading: "Worn by the culture" }} images={[{ id: "1", src: "https://x/y.jpg", alt: "" }]} />
      </>
    );
    expect(screen.queryByText("Coming soon")).toBeNull();
    expect(screen.getByText("Real tee")).toBeTruthy();
  });
});
