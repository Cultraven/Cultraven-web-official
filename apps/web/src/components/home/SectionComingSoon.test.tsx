import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));
vi.mock("@/components/common/CmsImage", () => ({ default: (p: any) => <img alt={p.alt} src={String(p.src)} /> }));
vi.mock("@/components/shop/ShopCard", () => ({ ShopCard: ({ product }: any) => <div data-testid="card">{product.title}</div> }));

import { NewDropSection } from "./NewDropSection";
import { BestsellersSection } from "./BestsellersSection";
import { TrendingNow } from "./TrendingNow";
import { CommunitySection } from "./CommunitySection";
import { ShopTheLookSection } from "./ShopTheLookSection";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

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
    expect(screen.getAllByRole("status")).toHaveLength(5); // one "Coming soon" bar per empty section
    for (const h of ["New Arrivals", "Best Sellers", "Trending Now", "Worn by the culture", "Shop The Look"]) expect(screen.getByRole("heading", { name: h })).toBeTruthy();
    expect(container.querySelectorAll("[data-testid=card]")).toHaveLength(0);
  });
  it("draws faint tiles in the shape of the real section: 4 cards, 6 photos, or a look + 2 pieces", () => {
    const { container } = render(
      <>
        <NewDropSection content={{ heading: "New Arrivals" }} products={[]} />
        <CommunitySection content={{ heading: "Worn by the culture" }} images={[]} />
        <ShopTheLookSection look={null} />
      </>
    );
    expect(container.querySelectorAll(".scs-cards .scs-ghost")).toHaveLength(4);
    expect(container.querySelectorAll(".scs-photos .scs-ghost")).toHaveLength(6);
    expect(container.querySelectorAll(".scs-look .scs-ghost")).toHaveLength(3);
    // decoration only: hidden from screen readers
    for (const g of Array.from(container.querySelectorAll(".scs-grid"))) expect(g.getAttribute("aria-hidden")).toBe("true");
  });
  it("Community offers a Follow on Instagram link only when the owner saved a safe https address", () => {
    const { rerender } = render(<CommunitySection content={{ heading: "Worn", instagramUrl: "https://www.instagram.com/cultraven._/" }} images={[]} />);
    const a = screen.getByRole("link", { name: /follow on instagram/i }) as HTMLAnchorElement;
    expect(a.href).toBe("https://www.instagram.com/cultraven._/");
    expect(a.rel).toContain("noopener");
    rerender(<CommunitySection content={{ heading: "Worn", instagramUrl: "javascript:alert(1)" }} images={[]} />);
    expect(screen.queryByRole("link", { name: /follow on instagram/i })).toBeNull();
    rerender(<CommunitySection content={{ heading: "Worn" }} images={[]} />);
    expect(screen.queryByRole("link", { name: /follow on instagram/i })).toBeNull();
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

describe("the drop-teaser look", () => {
  const renderAll = () =>
    render(
      <>
        <NewDropSection content={{ heading: "New Arrivals", eyebrow: "Just in" }} products={[]} />
        <BestsellersSection content={{ heading: "Best Sellers" }} products={[]} />
        <TrendingNow heading="Trending Now" items={[]} />
        <CommunitySection content={{ heading: "Worn by the culture" }} images={[]} />
        <ShopTheLookSection look={null} />
      </>
    );

  it("only the New Drop section gets the Notify me form (five stacked forms would be noise), and no empty section brings its own ribbon", () => {
    const { container } = renderAll();
    expect(screen.getAllByRole("button", { name: /notify me/i })).toHaveLength(1);
    expect(container.querySelector(".scs-ribbon")).toBeNull(); // the scrolling ribbon now lives under the hero and is managed in Admin -> Hero ribbon
  });

  it("every placeholder tile says Soon, is numbered, and carries the brand mark (hidden from screen readers)", () => {
    const { container } = render(<NewDropSection content={{ heading: "New Arrivals" }} products={[]} />);
    const tiles = Array.from(container.querySelectorAll(".scs-cards .scs-ghost"));
    expect(tiles.map((t) => t.querySelector(".scs-idx")?.textContent)).toEqual(["01", "02", "03", "04"]);
    for (const t of tiles) {
      expect(t.querySelector(".scs-chip")?.textContent).toBe("Soon");
      const mark = t.querySelector("img.scs-mark") as HTMLImageElement;
      expect(mark.getAttribute("alt")).toBe("");
      expect(mark.getAttribute("src")).toBe("/brand/logo-mark"); // the logo the owner can replace in the admin
    }
  });
});

describe("Notify me form", () => {
  const fill = (email: string) => {
    render(<NewDropSection content={{ heading: "New Arrivals" }} products={[]} />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  };

  it("saves the address to the newsletter list and thanks the visitor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "Subscribed" }) });
    vi.stubGlobal("fetch", fetchMock);
    fill("  Fan@Example.com ");
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));
    expect(await screen.findByText(/you.re on the list/i)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/newsletter");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "fan@example.com", interest: "New Arrivals", page: "/" }); // saved with what they asked about and the page they were on
  });

  it("does not send anything for an empty or invalid address", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fill("not-an-email");
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server's message when it says no (for example too many attempts) and lets them try again", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ message: "Too many subscription attempts. Please try again tomorrow." }) }));
    fill("fan@example.com");
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/too many subscription attempts/i);
    expect(screen.getByRole("button", { name: /notify me/i })).toBeTruthy();
  });

  it("explains a lost connection in plain words", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    fill("fan@example.com");
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/no connection/i));
  });
});
