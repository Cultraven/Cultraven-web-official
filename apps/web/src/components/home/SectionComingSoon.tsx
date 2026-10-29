/**
 * SectionComingSoon: what a home page section shows while the shop owner has not added anything to it yet
 * (no products, no photos, no cards). Everything that fills these sections is added in the admin panel.
 *
 * Look: the drop-teaser pattern used by sneaker and streetwear sites.
 *  - numbered placeholder tiles in the shape of the real items (product cards, photo bento, or a look + two pieces),
 *    each carrying the brand mark and a "Soon" tag
 *  - a navy bar underneath that says "Coming soon" (and, when `notify` is set, lets people leave an email to be told when it drops)
 */
import React from "react";
import "./SectionComingSoon.css";
import { NotifyForm } from "./NotifyForm";

export type GhostShape = "cards" | "photos" | "look";
const GHOST_COUNT: Record<GhostShape, number> = { cards: 4, photos: 6, look: 3 };

export interface ComingSoonCta { label: string; href: string }

/** Tiles + the "Coming soon" bar. Used by the home sections and by empty collection pages. */
export function ComingSoonPanel({ text, shape = "cards", cta, notify = false, idPrefix = "notify", interest = "" }: { text: string; shape?: GhostShape; cta?: ComingSoonCta; notify?: boolean; idPrefix?: string; /** What the visitor is asking to hear about; saved with the email and shown in Admin -> Subscribers. */ interest?: string }) {
  return (
    <div className="scs-panel">
      <div className={`scs-grid scs-${shape}`} aria-hidden="true">
        {Array.from({ length: GHOST_COUNT[shape] }, (_, i) => (
          <div className="scs-ghost" key={i}>
            <div className="scs-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="scs-mark" src="/brand/logo-mark" alt="" loading="lazy" decoding="async" />
              <span className="scs-chip">Soon</span>
              <span className="scs-idx">{String(i + 1).padStart(2, "0")}</span>
            </div>
            {shape === "cards" ? (
              <>
                <div className="scs-line scs-line-title" />
                <div className="scs-line scs-line-price" />
              </>
            ) : null}
          </div>
        ))}
      </div>

      <div className="scs-bar" role="status">
        <div className="scs-bar-text">
          <span className="scs-label"><span className="scs-dot" aria-hidden="true" />Coming soon</span>
          <p className="scs-text">{text}</p>
        </div>
        {notify ? (
          <div className="scs-bar-action"><NotifyForm idPrefix={idPrefix} interest={interest} /></div>
        ) : cta ? (
          <div className="scs-bar-action">
            <a className="scs-cta" href={cta.href} target="_blank" rel="noopener noreferrer">
              {cta.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SectionComingSoon({
  eyebrow,
  heading,
  text = "New pieces are on the way. Check back soon.",
  tone = "cream",
  shape = "cards",
  cta,
  notify = false,
}: {
  eyebrow?: string;
  heading: string;
  text?: string;
  tone?: "cream" | "mist";
  shape?: GhostShape;
  cta?: ComingSoonCta;
  /** Shows the "Notify me" email form in the bar. */
  notify?: boolean;
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
        <ComingSoonPanel text={text} shape={shape} cta={cta} notify={notify} interest={heading} idPrefix={`notify-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
      </div>
    </section>
  );
}
