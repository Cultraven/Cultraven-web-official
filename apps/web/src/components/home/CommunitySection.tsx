/**
 * CommunitySection — "WORN BY THE CULTURE" social/UGC grid.
 *
 * 6-image editorial bento grid of lifestyle photography (see .ugc-grid in styles/components.css).
 * Instagram handle CTA at the top right.
 * Clean mist (var(--color-mist)) background, no heavy UI chrome.
 */
import React from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
import { SectionComingSoon } from "./SectionComingSoon";

export interface UGCImage {
  id: string;
  src: string;
  alt: string;
  /** Link to the Instagram post this photo shows (optional). */
  href?: string;
}

/** "https://www.instagram.com/cultraven._/" -> "@CULTRAVEN._". Falls back to @CULTRAVEN when the address is not an Instagram profile. */
export function instagramHandle(url?: string): string {
  try {
    const u = new URL(url || "");
    if (u.protocol === "https:" && /(^|\.)instagram\.com$/i.test(u.hostname)) {
      const first = u.pathname.split("/").filter(Boolean)[0] || "";
      if (/^[A-Za-z0-9._]{1,30}$/.test(first) && !["p", "reel", "reels", "tv", "explore", "stories"].includes(first.toLowerCase())) return `@${first.toUpperCase()}`;
    }
  } catch { /* not a URL */ }
  return "@CULTRAVEN";
}

/** A tile only links out to an https address on instagram.com (anything else the admin typed is ignored). */
export function safeInstagramLink(url?: string): string {
  try {
    const u = new URL(url || "");
    return u.protocol === "https:" && /(^|\.)instagram\.com$/i.test(u.hostname) ? u.toString() : "";
  } catch { return ""; }
}

export interface CommunityContent {
  eyebrow?: string;
  heading?: string;
  instagramUrl?: string;
  ctaText?: string;
}

/** Content + photos come from the database (home.community). */
export function CommunitySection({ content, images }: { content: CommunityContent; images: UGCImage[] }) {
  if (images.length === 0) {
    const insta = content.instagramUrl && /^https:\/\//i.test(content.instagramUrl) ? content.instagramUrl : "";
    return <SectionComingSoon eyebrow={content.eyebrow} heading={content.heading || "Worn by the culture"} text="Our community photos are coming soon. Tag us on Instagram to be featured." tone="mist" shape="photos" cta={insta ? { label: "Follow on Instagram", href: insta } : undefined} />;
  }
  const handle = instagramHandle(content.instagramUrl);

  return (
    <section
      className="cv-auto"
      aria-labelledby="community-heading"
      style={{ backgroundColor: "var(--color-mist)", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--color-crimson)",
                marginBottom: "0.6rem",
              }}
            >
              {content.eyebrow}
            </span>
            <h2
              id="community-heading"
              style={{
                fontFamily: "var(--font-heading)",
                
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                fontWeight: 600,
                color: "var(--color-navy)",
                lineHeight: 1,
              }}
            >
              {content.heading}
            </h2>
          </div>

          <Link
            href={content.instagramUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-sans)",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
              borderBottom: "2px solid var(--color-navy)",
              paddingBottom: "2px",
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            {handle}
          </Link>
        </div>

        {/* Image grid: with fewer than 6 photos, data-count switches to a layout with no holes (see .ugc-grid in styles/components.css) */}
        <div
          className="ugc-grid"
          data-count={Math.min(images.length, 6)}
        >
          {images.map((img) => (
            <UGCTile key={img.id} image={img} handle={handle} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-gray)",
              letterSpacing: "0.06em",
              marginBottom: "1.25rem",
            }}
          >
            {content.ctaText}
          </p>
          <Link
            href={content.instagramUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.875rem 2.25rem",
              border: "2px solid var(--color-navy)",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="btn-outline-navy"
          >
            FOLLOW US ON INSTAGRAM
          </Link>
        </div>
      </div>

    </section>
  );
}

// ─── Single UGC Tile ───────────────────────────────────────────────────────────

function UGCTile({ image, handle }: { image: UGCImage; handle: string }) {
  const post = safeInstagramLink(image.href);
  const Tile: any = post ? "a" : "div";
  const linkProps = post ? { href: post, target: "_blank", rel: "noopener noreferrer", "aria-label": `View this post on Instagram${image.alt ? `: ${image.alt}` : ""}` } : {};
  return (
    <Tile
      {...linkProps}
      className="hv"
      style={{
        position: "relative",
        display: "block",
        overflow: "hidden",
        backgroundColor: "var(--color-border)",
        cursor: post ? "pointer" : "default",
      }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className="hv-zoom"
        style={{ objectFit: "cover" }}
      />

      {/* Hover overlay */}
      <div
        className="hv-reveal"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(23,37,69,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-cream)"
            strokeWidth="1.5"
            style={{ marginBottom: "8px", margin: "0 auto 8px" }}
          >
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="var(--color-cream)" stroke="none" />
          </svg>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--color-cream)",
            }}
          >
            {handle}
          </p>
        </div>
      </div>
    </Tile>
  );
}
