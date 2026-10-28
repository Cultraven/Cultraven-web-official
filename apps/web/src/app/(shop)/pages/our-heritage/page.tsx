import type { Metadata } from "next";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";
import { PageHero } from "@/components/common/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The story behind CULTRAVEN: an Indian clothing brand making premium oversized t-shirts, hoodies and streetwear.",
};

export default async function AboutPage() {
  const section = await getCmsSection<any>("page.heritage");
  const sections = liveItems<any>(section.data?.sections);
  const values: { id: string; title: string; desc: string }[] = section.data?.values ?? [];
  const heroImage: string = section.data?.heroImage ?? "";

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      <PageHero slug="our-heritage" tall fallbackImage={heroImage} defaults={{ eyebrow: "CULTRAVEN", title: "Our Story", subtitle: "Premium oversized t-shirts, hoodies and streetwear from India." }} />

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
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "1.5rem" }}>{section.data?.valuesEyebrow || "What we stand for"}</p>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 600, color: "var(--color-cream)", marginBottom: "3rem" }}>{section.data?.valuesHeading || "The CULTRAVEN Values"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2rem" }} className="values-grid">
          {values.map((v) => (
            <div key={v.id} style={{ padding: "2rem", borderTop: "2px solid rgba(245,241,232,0.15)" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "var(--color-cream)", marginBottom: "0.75rem" }}>{v.title}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "rgba(245,241,232,0.6)", lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
