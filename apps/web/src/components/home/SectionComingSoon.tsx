/**
 * SectionComingSoon: what a home page section shows while the shop owner has not added anything to it yet
 * (no products, no photos, no cards). Everything that fills these sections is added in the admin panel.
 *
 * It keeps the section's real heading and draws faint "ghost" tiles in the same shape the real items will have
 * (product cards, photo bento, or a look + two pieces), with a "Coming soon" badge on top.
 */
import React from "react";
import "./SectionComingSoon.css";

export type GhostShape = "cards" | "photos" | "look";
const GHOST_COUNT: Record<GhostShape, number> = { cards: 4, photos: 6, look: 3 };

export interface ComingSoonCta { label: string; href: string }

export function SectionComingSoon({
  eyebrow,
  heading,
  text = "New pieces are on the way. Check back soon.",
  tone = "cream",
  shape = "cards",
  cta,
}: {
  eyebrow?: string;
  heading: string;
  text?: string;
  tone?: "cream" | "mist";
  shape?: GhostShape;
  cta?: ComingSoonCta;
}) {
  return (
    <section
      className="cv-auto scs"
      aria-label={`${heading} (coming soon)`}
      style={{ backgroundColor: tone === "mist" ? "var(--color-mist)" : "var(--color-cream)" }}
    >
      <div className="scs-inner">
        <div className="scs-head">
          {eyebrow ? <span className="scs-eyebrow">{eyebrow}</span> : null}
          <h2 className="scs-heading">{heading}</h2>
        </div>

        <div className="scs-stage">
          <div className={`scs-grid scs-${shape}`} aria-hidden="true">
            {Array.from({ length: GHOST_COUNT[shape] }, (_, i) => (
              <div className="scs-ghost" key={i}>
                <div className="scs-media" />
                {shape === "cards" ? (
                  <>
                    <div className="scs-line scs-line-title" />
                    <div className="scs-line scs-line-price" />
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <div className="scs-overlay">
            <div className="scs-badge" role="status">
              <span className="scs-label"><span className="scs-dot" aria-hidden="true" />Coming soon</span>
              <p className="scs-text">{text}</p>
              {cta ? (
                <a className="scs-cta" href={cta.href} target="_blank" rel="noopener noreferrer">
                  {cta.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
