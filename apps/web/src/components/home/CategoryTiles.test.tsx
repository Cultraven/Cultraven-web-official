import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryTiles } from "./CategoryTiles";

// Mock the image wrapper (next/image needs the Next runtime)
vi.mock("@/components/common/CmsImage", () => ({
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} data-fill={fill ? "true" : "false"} />;
  },
}));

const strip = [
  { id: "s1", label: "New In", href: "/collections/new-in" },
  { id: "s2", label: "Sale", href: "/collections/sale", accent: true },
];
const tiles = [
  { id: "t1", title: "Oversized Tees", sub: "From ₹1,499", href: "/collections/t-shirts", image: "https://images.unsplash.com/a", size: "tall" as const },
  { id: "t2", title: "Hoodies", sub: "From ₹2,499", href: "/collections/hoodies", image: "https://images.unsplash.com/b", size: "normal" as const },
  { id: "t3", title: "Outerwear", sub: "From ₹3,499", href: "/collections/outerwear", image: "https://images.unsplash.com/c", size: "wide" as const },
];

describe("CategoryTiles (database-driven props)", () => {
  it("renders exactly the strip links and tiles it is given", () => {
    render(<CategoryTiles strip={strip} tiles={tiles} />);
    expect(screen.getByText("New In")).toBeDefined();
    expect(screen.getByText("Sale")).toBeDefined();
    expect(screen.getByText("Oversized Tees")).toBeDefined();
    expect(screen.getByText("Outerwear")).toBeDefined();
  });

  it("applies the layout class for each tile size", () => {
    const { container } = render(<CategoryTiles strip={strip} tiles={tiles} />);
    expect(container.querySelector(".cat-tile-tall")).not.toBeNull();
    expect(container.querySelector(".cat-tile-wide")).not.toBeNull();
    expect(container.querySelectorAll(".cat-tile").length).toBe(3);
  });

  it("does not invent content when given no tiles", () => {
    const { container } = render(<CategoryTiles strip={[]} tiles={[]} />);
    expect(container.querySelectorAll(".cat-tile").length).toBe(0);
    expect(screen.queryByText("Hoodies")).toBeNull();
  });
});
