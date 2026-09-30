import Link from "next/link";
import { SECTIONS } from "@/lib/cms/registry";

const EXTRA = [
  { href: "/portal-secure/cms/hero", group: "Homepage", label: "Hero (image / video / slideshow)", description: "Main homepage hero media, text and CTAs." },
  { href: "/portal-secure/cms/shop-the-look", group: "Homepage", label: "Shop the Look", description: "Model image and the shoppable pieces in the look." },
  { href: "/portal-secure/products", group: "Shop", label: "Products & galleries", description: "Product details, gallery images, New arrival / Bestseller flags." },
];

export default function AdminCmsIndexPage() {
  const groups = ["Site", "Homepage", "Shop", "Pages"] as const;
  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: 980 }}>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: 6 }}>Content</p>
      <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", marginBottom: 6 }}>Website content</h1>
      <p style={{ fontSize: "0.82rem", color: "rgba(245,241,232,0.5)", marginBottom: "2rem" }}>
        Everything here is saved to the database and shown on the live website. Changes appear as soon as you save.
      </p>
      {groups.map((g) => {
        const items = [
          ...EXTRA.filter((e) => e.group === g),
          ...SECTIONS.filter((s) => s.group === g).map((s) => ({ href: `/portal-secure/cms/${s.key}`, label: s.label, description: s.description })),
        ];
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(245,241,232,0.45)", marginBottom: 10 }}>{g}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {items.map((it) => (
                <Link key={it.href} href={it.href} style={{ display: "block", padding: "1rem 1.1rem", backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, textDecoration: "none" }}>
                  <div style={{ color: "var(--color-cream)", fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>{it.label}</div>
                  <div style={{ color: "rgba(245,241,232,0.45)", fontSize: "0.72rem", lineHeight: 1.45 }}>{it.description}</div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
