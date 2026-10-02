/**
 * BrandStorySection — editorial brand manifesto section.
 *
 * Full-width cinematic image (+ optional looping video) with dark overlay.
 * Every piece of copy, link and media comes from the database (home.brandStory).
 */
import React from "react";
import Link from "next/link";

export interface BrandStoryContent {
  eyebrow?: string;
  headline: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
  videoUrl?: string;
}

export function BrandStorySection({ content }: { content: BrandStoryContent }) {
  const videoType = content.videoUrl && content.videoUrl.toLowerCase().split("?")[0].endsWith(".webm") ? "video/webm" : "video/mp4";

  return (
    <section
      className="cv-auto bs-section"
      aria-labelledby="brand-story-heading"
      style={{
        position: "relative",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "var(--color-navy)",
      }}
    >
      {/* Background image — also the poster / fallback if the video fails to load */}
      {content.image ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage: `url("${content.image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}
      {content.videoUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={content.image || undefined}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
        >
          <source src={content.videoUrl} type={videoType} />
        </video>
      ) : null}

      {/* Overlay — left-heavy for text legibility */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(105deg, rgba(23,37,69,0.88) 0%, rgba(23,37,69,0.65) 45%, rgba(23,37,69,0.20) 100%)",
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div
        className="bs-inner"
        style={{
          position: "relative",
          zIndex: 10,
          paddingInline: "clamp(1.25rem,4vw,5rem)",
          paddingBlock: "clamp(5rem,10vw,10rem)",
          maxWidth: "720px",
        }}
      >
        {content.eyebrow ? (
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--color-crimson)",
              marginBottom: "1.5rem",
            }}
          >
            {content.eyebrow}
          </span>
        ) : null}

        <h2
          id="brand-story-heading"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem,6vw,5.5rem)",
            fontWeight: 600,
            color: "var(--color-cream)",
            lineHeight: 1.0,
            letterSpacing: "-0.01em",
            marginBottom: "2rem",
            whiteSpace: "pre-line",
          }}
        >
          {content.headline}
        </h2>

        {content.body ? (
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1rem",
              lineHeight: 1.8,
              color: "rgba(245,241,232,0.75)",
              maxWidth: "440px",
              marginBottom: "3rem",
              whiteSpace: "pre-line",
            }}
          >
            {content.body}
          </p>
        ) : null}

        {content.ctaLabel && content.ctaHref ? (
          <Link
            href={content.ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-cream)",
              borderBottom: "2px solid",
              paddingBottom: "4px",
            }}
            className="link-underline-cta"
          >
            {content.ctaLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
