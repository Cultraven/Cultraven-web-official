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
        backgroundColor: "#172545",
      }}
    >
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
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
            "linear-gradient(105deg, rgba(23,37,69,0.92) 0%, rgba(23,37,69,0.70) 45%, rgba(23,37,69,0.30) 100%)",
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
            color: "#C94227",
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
            color: "#F5F1E8",
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
            color: "#F5F1E8",
            borderBottom: "2px solid rgba(245,241,232,0.5)",
            paddingBottom: "4px",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "#C94227";
            (e.currentTarget as HTMLAnchorElement).style.color = "#C94227";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(245,241,232,0.5)";
            (e.currentTarget as HTMLAnchorElement).style.color = "#F5F1E8";
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
