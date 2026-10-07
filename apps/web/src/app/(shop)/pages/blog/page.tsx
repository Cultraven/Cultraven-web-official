import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Style Guides & News",
  description: "Style guides, new arrivals and stories from CULTRAVEN.",
};

const POSTS = [
  { slug: "drop-dharma-series", date: "Sep 2025", category: "NEW ARRIVALS", title: "DHARMA SERIES: Our Biggest Collection Yet", excerpt: "260 GSM, acid-washed, premium graphics — here's everything behind our biggest collection of the year." },
  { slug: "gen-z-streetwear-guide", date: "Aug 2025", category: "STYLE GUIDE", title: "HOW TO BUILD A WARDROBE YOU'LL ACTUALLY WEAR", excerpt: "Skip the fast-fashion trap. Here's how to pick pieces that last, fit well and work together." },
  { slug: "behind-the-brand", date: "Jul 2025", category: "ABOUT US", title: "ABOUT CULTRAVEN: QUALITY CLOTHING, MADE WITH CARE", excerpt: "The story behind the brand, our focus on craft, and why we do what we do." },
];

export default function BlogPage() {
  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", paddingBottom: "6rem" }}>
      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "3rem", paddingBottom: "2rem", borderBottom: "1px solid var(--color-line)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-gray)", marginBottom: "0.75rem" }}>STYLE GUIDES &amp; NEWS</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.02em" }}>BLOG</h1>
      </div>

      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "2.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
        {POSTS.map((post) => (
          <article key={post.slug} style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px var(--color-navy)" }}>
            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 8px", backgroundColor: "var(--color-navy)", color: "var(--color-cream)" }}>{post.category}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--color-gray)", letterSpacing: "0.08em" }}>{post.date}</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 400, color: "var(--color-navy)", lineHeight: 1.2, marginBottom: "0.875rem", textTransform: "uppercase" }}>{post.title}</h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)", lineHeight: 1.6, marginBottom: "1.5rem" }}>{post.excerpt}</p>
              <Link href={`/pages/blog/${post.slug}`} style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", textDecoration: "none", borderBottom: "2px solid var(--color-lava)", paddingBottom: "2px" }}>
                READ MORE →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
