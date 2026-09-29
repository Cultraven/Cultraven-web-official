import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Journal | CULTRAVEN",
  description: "Stories, style notes, culture and people from the CULTRAVEN journal.",
};

const ARTICLES = [
  { id: "j1", title: "The Rise of the Oversized Silhouette in Indian Streetwear", category: "STYLE", date: "Sep 2026", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80", excerpt: "How the oversized drop-shoulder became the defining shape of a generation's wardrobe.", slug: "oversized-silhouette-indian-streetwear", featured: true },
  { id: "j2", title: "What Fabric Weight Actually Means for Your Wardrobe", category: "FASHION", date: "Aug 2026", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80", excerpt: "The difference between 160 GSM, 200 GSM and 260 GSM — and why it matters.", slug: "fabric-weight-wardrobe", featured: false },
  { id: "j3", title: "Delhi Street Culture: The Photographers Shaping Indian Fashion", category: "CULTURE", date: "Aug 2026", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80", excerpt: "Meet the photographers documenting India's growing streetwear scene.", slug: "delhi-street-culture-photographers", featured: false },
  { id: "j4", title: "Building a Capsule Wardrobe Around Streetwear Basics", category: "STYLE", date: "Jul 2026", image: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=800&auto=format&fit=crop&q=80", excerpt: "Five essentials that work together and anchor everything else.", slug: "capsule-wardrobe-streetwear-basics", featured: false },
  { id: "j5", title: "Acid Wash: A History of the Process That Never Goes Out of Style", category: "FASHION", date: "Jul 2026", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80", excerpt: "From 1980s rock culture to Gen-Z streetwear — why acid wash endures.", slug: "acid-wash-history", featured: false },
  { id: "j6", title: "Music and Fashion: The Playlist That's Defining This Season", category: "MUSIC", date: "Jun 2026", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80", excerpt: "The tracks behind the CULTRAVEN AW2026 campaign shoot.", slug: "music-fashion-playlist", featured: false },
];

const CATEGORIES = ["ALL", "STYLE", "CULTURE", "FASHION", "PEOPLE", "MUSIC"];

export default function JournalPage() {
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#172545", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.75rem" }}>STORIES & IDEAS</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 1 }}>The Journal</h1>
      </div>

      {/* Category filter */}
      <div style={{ backgroundColor: "#EAE6DB", padding: "1.25rem clamp(1.25rem,4vw,5rem)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} style={{ padding: "0.4rem 1rem", border: "1.5px solid #172545", backgroundColor: cat === "ALL" ? "#172545" : "transparent", color: cat === "ALL" ? "#F5F1E8" : "#172545", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>{cat}</button>
        ))}
      </div>

      <div style={{ padding: "3rem clamp(1.25rem,4vw,5rem)" }}>
        {/* Featured article */}
        <Link href={`/journal/${featured.slug}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", marginBottom: "4rem", textDecoration: "none" }} className="featured-article">
          <div style={{ position: "relative", minHeight: "420px", overflow: "hidden", backgroundColor: "#EAE6DB" }}>
            <Image src={featured.image} alt={featured.title} fill sizes="50vw" style={{ objectFit: "cover", transition: "transform 0.6s ease" }} className="featured-img" />
          </div>
          <div style={{ backgroundColor: "#172545", padding: "clamp(2.5rem,4vw,4rem)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94227", marginBottom: "1rem", display: "block" }}>FEATURED · {featured.category}</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 1.1, marginBottom: "1.25rem" }}>{featured.title}</h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(245,241,232,0.65)", marginBottom: "2rem" }}>{featured.excerpt}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "rgba(245,241,232,0.45)", fontWeight: 600 }}>{featured.date}</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F1E8", borderBottom: "1px solid rgba(245,241,232,0.4)", paddingBottom: "1px" }}>READ MORE →</span>
            </div>
          </div>
        </Link>

        {/* Article grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem" }} className="journal-grid">
          {rest.map((a) => (
            <Link key={a.id} href={`/journal/${a.slug}`} style={{ display: "block", textDecoration: "none" }}>
              <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", backgroundColor: "#EAE6DB", marginBottom: "1rem" }}>
                <Image src={a.image} alt={a.title} fill sizes="33vw" style={{ objectFit: "cover", transition: "transform 0.5s ease" }} className="article-img" />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C94227", display: "block", marginBottom: "0.5rem" }}>{a.category} · {a.date}</span>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "1.4rem", fontWeight: 600, color: "#172545", lineHeight: 1.2, marginBottom: "0.625rem" }}>{a.title}</h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.7, color: "#4B5563" }}>{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .featured-img:hover { transform: scale(1.04); }
        .article-img:hover { transform: scale(1.05); }
        @media (max-width: 900px) { .featured-article { grid-template-columns: 1fr !important; } .journal-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px) { .journal-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
