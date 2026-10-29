/**
 * SectionComingSoon: what a home page section shows while the shop owner has not added anything to it yet
 * (no products, no photos, no cards). Everything that fills these sections is added in the admin panel.
 */
import React from "react";

export function SectionComingSoon({ eyebrow, heading, text = "New pieces are on the way. Check back soon.", tone = "cream" }: { eyebrow?: string; heading: string; text?: string; tone?: "cream" | "mist" }) {
  return (
    <section
      className="cv-auto"
      aria-label={`${heading} (coming soon)`}
      style={{ backgroundColor: tone === "mist" ? "var(--color-mist)" : "var(--color-cream)", padding: "clamp(3rem,6vw,5.5rem) clamp(1rem,4vw,5rem)", borderBottom: "1px solid var(--color-line)" }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {eyebrow ? <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", margin: "0 0 0.75rem" }}>{eyebrow}</p> : null}
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4.5vw,3.75rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1, margin: "0 0 1.75rem" }}>{heading}</h2>
        <div style={{ border: "2px dashed rgba(23,37,84,0.25)", borderRadius: 12, padding: "clamp(2rem,5vw,3.5rem) 1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-navy)", margin: "0 0 0.6rem" }}>Coming soon</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", lineHeight: 1.6, color: "var(--color-gray)", margin: 0 }}>{text}</p>
        </div>
      </div>
    </section>
  );
}
