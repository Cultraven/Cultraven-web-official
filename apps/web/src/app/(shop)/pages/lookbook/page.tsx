import type { Metadata } from "next";
import Link from "next/link";
import Image from "@/components/common/CmsImage";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "CULTRAVEN lookbook — the visual identity of a generation. Shot on the streets of India.",
};

export default async function LookbookPage() {
  const section = await getCmsSection<any>("page.lookbook");
  const LOOKS = liveItems<any>(section.data?.items);

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
          Shot on the streets of India. Shop the looks you love.
        </p>
      </div>

      {/* ── Looks Grid ── */}
      <section style={{ padding: "5rem clamp(1.25rem,5vw,5rem)" }}>
        {LOOKS.length === 0 ? (
          <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", color: "var(--color-gray)" }}>New looks are coming soon.</p>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2.5rem", maxWidth: "1280px", margin: "0 auto" }}>
          {LOOKS.map((look: any) => (
            <article key={look.id} style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", boxShadow: "5px 5px 0px 0px var(--color-lava)" }}>

              {/* Image */}
              <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-bone)" }}>
                <Image src={look.image} alt={look.title} fill sizes="(max-width: 700px) 100vw, 400px" style={{ objectFit: "cover" }} />
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
                  {(look.products ?? []).map((p: { id: string; name: string }) => (
                    <span key={p.id} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-navy)", opacity: 0.6 }}>
                      ✦ {p.name}
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
          SHOP THE LOOKBOOK.
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
