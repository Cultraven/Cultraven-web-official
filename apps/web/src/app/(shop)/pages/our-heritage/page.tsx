import type { Metadata } from "next";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story | CULTRAVEN",
  description: "The story behind CULTRAVEN — a premium Gen-Z streetwear brand built for the generation creating its own culture.",
};

export default async function AboutPage() {
  const section = await getCmsSection<any>("page.heritage");
  const sections = liveItems<any>(section.data?.sections);
  const values: { id: string; title: string; desc: string }[] = section.data?.values ?? [];
  const heroImage: string = section.data?.heroImage ?? "";

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "70vh", minHeight: "400px", overflow: "hidden", backgroundColor: "var(--color-navy)", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: heroImage ? `url("${heroImage}")` : undefined, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.4 }} aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 10, paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "1rem" }}>CULTRAVEN</p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,8vw,7rem)", fontWeight: 600, color: "var(--color-cream)", lineHeight: 0.95, letterSpacing: "-0.02em" }}>Our Story</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", color: "rgba(245,241,232,0.7)", maxWidth: "500px", marginTop: "1.5rem", lineHeight: 1.7 }}>NOT MADE TO BLEND IN. Built for the generation creating its own culture.</p>
        </div>
      </div>

      {/* Sections */}
      {sections.map((sec: any, i: number) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "60vh" }} className="about-section">
          <div style={{ position: "relative", minHeight: "400px", order: sec.reverse ? 2 : 1 }}>
            <img src={sec.image} alt={sec.heading} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(3rem,6vw,7rem)", backgroundColor: i % 2 === 0 ? "var(--color-cream)" : "var(--color-mist)", order: sec.reverse ? 1 : 2 }}>
            <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "1.25rem" }}>{sec.tag}</span>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.1, marginBottom: "1.5rem" }}>{sec.heading}</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", lineHeight: 1.8, color: "#4B5563", maxWidth: "420px" }}>{sec.body}</p>
          </div>
        </div>
      ))}

      {/* Brand values */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(4rem,8vw,8rem) clamp(1.25rem,4vw,5rem)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "1.5rem" }}>What we stand for</p>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 600, color: "var(--color-cream)", marginBottom: "3rem" }}>The CULTRAVEN Values</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2rem" }} className="values-grid">
          {values.map((v) => (
            <div key={v.id} style={{ padding: "2rem", borderTop: "2px solid rgba(245,241,232,0.15)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "var(--color-cream)", marginBottom: "0.75rem" }}>{v.title}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "rgba(245,241,232,0.6)", lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-section { grid-template-columns: 1fr !important; }
          .about-section > div { order: unset !important; }
          .values-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
