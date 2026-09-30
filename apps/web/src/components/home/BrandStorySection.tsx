/**
 * BrandStorySection — editorial brand manifesto section.
 *
 * Full-width cinematic image with dark overlay.
 * "THE CULTURE" eyebrow.
 * Large italic editorial headline + concise copy.
 * CTA: EXPLORE THE STORY → /about
 */
"use client";

import React from "react";
import Link from "next/link";

export function BrandStorySection() {
  return (
    <section
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
      {/* Background video */}
      {/* Fallback background image shown while/if video doesn't load */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundImage: "url('https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1400&auto=format&fit=crop&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1400&auto=format&fit=crop&q=80"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-young-man-in-streetwear-standing-outdoors-42289-large.mp4" type="video/mp4" />
      </video>

      {/* Overlay — left-heavy for text legibility */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(105deg, rgba(23,37,69,0.88) 0%, rgba(23,37,69,0.65) 45%, rgba(23,37,69,0.20) 100%)",
        zIndex: 2,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          paddingInline: "clamp(1.25rem,4vw,5rem)",
          paddingBlock: "clamp(5rem,10vw,10rem)",
          maxWidth: "720px",
        }}
      >
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
          THE CULTURE
        </span>

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
          {"Clothes aren't just\nwhat you wear."}
        </h2>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1rem",
            lineHeight: 1.8,
            color: "rgba(245,241,232,0.75)",
            maxWidth: "440px",
            marginBottom: "3rem",
          }}
        >
          {"They're how you move through the world. CULTRAVEN is built for\nthe generation that refuses to be defined by anyone else's rules."}
        </p>

        <Link
          href="/pages/our-heritage"
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
            borderBottom: "2px solid rgba(245,241,232,0.5)",
            paddingBottom: "4px",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-crimson)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-crimson)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(245,241,232,0.5)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-cream)";
          }}
        >
          EXPLORE THE STORY
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
