import type { Metadata } from "next";
import Link from "next/link";
import Image from "@/components/common/CmsImage";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal | CULTRAVEN",
  description: "Stories, style notes, culture and people from the CULTRAVEN journal.",
};

const CATEGORIES = ["ALL", "STYLE", "CULTURE", "FASHION", "PEOPLE", "MUSIC"];

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const activeCat = CATEGORIES.includes((category ?? "").toUpperCase()) ? (category as string).toUpperCase() : "ALL";
  const section = await getCmsSection<any>("page.journal");
  const ARTICLES = liveItems<any>(section.data?.items).filter((a) => activeCat === "ALL" || String(a.category).toUpperCase() === activeCat);
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.75rem" }}>STORIES & IDEAS</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "var(--color-cream)", lineHeight: 1 }}>The Journal</h1>
      </div>

      {/* Category filter */}
      <div style={{ backgroundColor: "var(--color-mist)", padding: "1.25rem clamp(1.25rem,4vw,5rem)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={cat === "ALL" ? "/pages/journal" : `/pages/journal?category=${cat}`} aria-current={cat === activeCat ? "page" : undefined} style={{ display: "inline-flex", alignItems: "center", minHeight: "40px", textDecoration: "none", padding: "0.4rem 1rem", border: "1.5px solid var(--color-navy)", backgroundColor: cat === activeCat ? "var(--color-navy)" : "transparent", color: cat === activeCat ? "var(--color-cream)" : "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>{cat}</Link>
        ))}
      </div>

      <div style={{ padding: "3rem clamp(1.25rem,4vw,5rem)" }}>
        {ARTICLES.length === 0 ? (
          <p style={{ textAlign: "center", fontFamily: "var(--font-sans)", color: "var(--color-gray)" }}>{activeCat === "ALL" ? "New stories are coming soon." : `No ${activeCat.toLowerCase()} stories yet.`}</p>
        ) : null}

        {/* Featured article */}
        {featured ? (
        <Link href={`/journal/${featured.slug}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", marginBottom: "4rem", textDecoration: "none" }} className="featured-article">
          <div style={{ position: "relative", minHeight: "420px", overflow: "hidden", backgroundColor: "var(--color-mist)" }}>
            <Image src={featured.image} alt={featured.title} fill sizes="50vw" style={{ objectFit: "cover", transition: "transform 0.6s ease" }} className="featured-img" />
          </div>
          <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(2.5rem,4vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "1rem", display: "block" }}>FEATURED · {featured.category}</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 600, color: "var(--color-cream)", lineHeight: 1.1, marginBottom: "1.25rem" }}>{featured.title}</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(245,241,232,0.65)", marginBottom: "2rem" }}>{featured.excerpt}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "rgba(245,241,232,0.45)", fontWeight: 600 }}>{featured.date}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-cream)", borderBottom: "1px solid rgba(245,241,232,0.4)", paddingBottom: "1px" }}>READ MORE →</span>
            </div>
          </div>
        </Link>
        ) : null}

        {/* Article grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem" }} className="journal-grid">
          {rest.map((a: any) => (
            <Link key={a.id} href={`/journal/${a.slug}`} style={{ display: "block", textDecoration: "none" }}>
              <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", backgroundColor: "var(--color-mist)", marginBottom: "1rem" }}>
                <Image src={a.image} alt={a.title} fill sizes="33vw" style={{ objectFit: "cover", transition: "transform 0.5s ease" }} className="article-img" />
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-crimson)", display: "block", marginBottom: "0.5rem" }}>{a.category} · {a.date}</span>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.2, marginBottom: "0.625rem" }}>{a.title}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", lineHeight: 1.7, color: "#4B5563" }}>{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
