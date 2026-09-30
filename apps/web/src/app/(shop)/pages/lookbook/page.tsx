import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lookbook | CULTRAVEN",
  description: "CULTRAVEN lookbook — the visual identity of a generation. Shot on the streets of India.",
};

const LOOKS = [
  {
    id: "lk1",
    season: "AW 2026",
    title: "RAVEN IN THE CITY",
    desc: "Oversized graphics, cargo layers, lava accents. The cult on concrete.",
    img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    href: "/collections/dharma",
    products: ["Dharma EP01 Tee", "Raven Cargo", "Lava Stripe Hoodie"],
  },
  {
    id: "lk2",
    season: "AW 2026",
    title: "ACID STATE",
    desc: "Washed-out finishes, heavyweight cotton, zero compromise.",
    img: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
    href: "/collections/acid-state",
    products: ["Acid State Wash Tee", "Wide-Leg Cargo", "Dragon Blood Hoodie"],
  },
  {
    id: "lk3",
    season: "SS 2026",
    title: "CORE ESSENTIALS",
    desc: "Stripped back. Built to last. The CULTRAVEN uniform.",
    img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80",
    href: "/collections/core",
    products: ["260 GSM Blank Tee", "Cult Wide-Leg Jeans", "Core Sweat"],
  },
  {
    id: "lk4",
    season: "SS 2026",
    title: "DRAGON BLOOD",
    desc: "Mythic screen-print meets heavyweight silence.",
    img: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80",
    href: "/collections/dragon-blood",
    products: ["Dragon Blood Graphic Tee", "Raven Black Cargo", "Oversized Coach"],
  },
];

export default function LookbookPage() {
  return (
    <main style={{ backgroundColor: "var(--color-cream)", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "6rem clamp(1.25rem,5vw,5rem) 4rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: "1rem" }}>
          CULTRAVEN / VISUAL IDENTITY
        </p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,7vw,6rem)", fontWeight: 400, color: "var(--color-cream)", textTransform: "uppercase", lineHeight: 1, marginBottom: "1.5rem" }}>
          LOOKBOOK
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", color: "rgba(245,241,232,0.6)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          Shot on the streets of India. The culture wears itself.
        </p>
      </div>

      {/* ── Looks Grid ── */}
      <section style={{ padding: "5rem clamp(1.25rem,5vw,5rem)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2.5rem", maxWidth: "1280px", margin: "0 auto" }}>
          {LOOKS.map((look) => (
            <article key={look.id} style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", boxShadow: "5px 5px 0px 0px var(--color-lava)" }}>

              {/* Image */}
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-bone)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={look.img} alt={look.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: "12px", left: "12px", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 10px" }}>
                  {look.season}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "1.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "0.6rem" }}>
                  {look.title}
                </h2>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--color-gray)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  {look.desc}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "1.25rem" }}>
                  {look.products.map((p) => (
                    <span key={p} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-navy)", opacity: 0.6 }}>
                      ✦ {p}
                    </span>
                  ))}
                </div>
                <Link
                  href={look.href}
                  style={{ display: "inline-block", padding: "0.65rem 1.5rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", border: "2px solid var(--color-navy)", boxShadow: "3px 3px 0px 0px var(--color-lava)" }}
                >
                  SHOP THIS LOOK →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "4rem clamp(1.25rem,5vw,5rem)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 400, color: "var(--color-cream)", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          WEAR THE CULTURE.
        </h2>
        <Link
          href="/collections/all"
          style={{ display: "inline-block", padding: "1rem 2.5rem", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", border: "2px solid var(--color-lava)", boxShadow: "4px 4px 0px 0px var(--color-cream)" }}
        >
          SHOP ALL STYLES →
        </Link>
      </div>
    </main>
  );
}
