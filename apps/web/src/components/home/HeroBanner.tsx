/**
 * HeroBanner — Full-viewport campaign hero.
 *
 * Uses a CSS background-image (not next/image) for the full-bleed effect
 * to avoid the `fill` + relative parent gotcha.
 * Text overlaid on the left with a dark gradient for legibility.
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { HeroSlide } from "@shop/types";

interface HeroBannerProps {
  slide: HeroSlide;
  siteUrl: string;
}

interface SlideData {
  id: string;
  bgImage: string;
  tag: string;
  headline: string;
  subline: string;
  cta1Text: string;
  cta1Href: string;
  cta2Text: string;
  cta2Href: string;
}

const SLIDES: SlideData[] = [
  {
    id: "s2",
    bgImage:
      "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=1920&auto=format&fit=crop&q=85",
    tag: "ACID STATE — VINTAGE WASH COLLECTION",
    headline: "WASHED.\nRAW.\nDIFFERENT.",
    subline: "Pre-washed distressed 260 GSM heavyweights.\nEvery piece tells a story no one else can copy.",
    cta1Text: "SHOP ACID STATE",
    cta1Href: "/category/acid-state",
    cta2Text: "VIEW LOOKBOOK",
    cta2Href: "/collections/lookbook",
  },
  {
    id: "s3",
    bgImage:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1920&auto=format&fit=crop&q=85",
    tag: "DHARMA EP01 — MYTHOLOGY REIMAGINED",
    headline: "YOUR\nMYTH.\nYOUR\nARMOR.",
    subline: "Original Indian mythological screen-prints\non heavyweight cotton. Wear what they can't understand.",
    cta1Text: "SHOP DHARMA",
    cta1Href: "/category/dharma",
    cta2Text: "OUR STORY",
    cta2Href: "/pages/our-heritage",
  },
];

export function HeroBanner({ slide: _slide, siteUrl: _siteUrl }: HeroBannerProps) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (idx: number) => {
    if (idx === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(idx);
      setFading(false);
    }, 300);
  };

  const prev = () => goTo((active - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((active + 1) % SLIDES.length);

  const slide = SLIDES[active];

  return (
    <section
      aria-label="Campaign Hero"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#172545",
      }}
    >
      {/* ── Background image (CSS bg for reliable rendering) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${slide.bgImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.4s ease",
          willChange: "opacity",
        }}
      />

      {/* ── Gradient overlay (left-heavy for text legibility) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(105deg, rgba(23,37,69,0.82) 0%, rgba(23,37,69,0.55) 50%, rgba(23,37,69,0.20) 100%)",
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "clamp(1.5rem, 4vw, 6rem)",
          paddingTop: "100px", // clear sticky header
          maxWidth: "760px",
        }}
      >
        {/* Tag */}
        <span
          style={{
            display: "block",
            marginBottom: "1rem",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#C94227",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease 0.1s",
          }}
        >
          {slide.tag}
        </span>

        {/* Headline — massive */}
        <h1
          style={{
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            fontWeight: 900,
            fontSize: "clamp(3.5rem, 10vw, 8.5rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            color: "#F5F1E8",
            whiteSpace: "pre-line",
            marginBottom: "1.75rem",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease 0.15s",
          }}
        >
          {slide.headline}
        </h1>

        {/* Subline */}
        <p
          style={{
            fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)",
            fontWeight: 500,
            lineHeight: 1.6,
            color: "rgba(245,241,232,0.85)",
            whiteSpace: "pre-line",
            maxWidth: "420px",
            marginBottom: "2.5rem",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease 0.2s",
          }}
        >
          {slide.subline}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease 0.25s",
          }}
        >
          <Link
            href={slide.cta1Href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem 2.25rem",
              backgroundColor: "#F5F1E8",
              color: "#172545",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontWeight: 800,
              fontSize: "0.78rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              border: "2px solid #F5F1E8",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "#C94227";
              el.style.borderColor = "#C94227";
              el.style.color = "#F5F1E8";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "#F5F1E8";
              el.style.borderColor = "#F5F1E8";
              el.style.color = "#172545";
            }}
          >
            {slide.cta1Text}
          </Link>

          <Link
            href={slide.cta2Href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem 2.25rem",
              backgroundColor: "transparent",
              color: "#F5F1E8",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontWeight: 800,
              fontSize: "0.78rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              border: "2px solid rgba(245,241,232,0.6)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "#F5F1E8";
              el.style.backgroundColor = "rgba(245,241,232,0.1)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "rgba(245,241,232,0.6)";
              el.style.backgroundColor = "transparent";
            }}
          >
            {slide.cta2Text}
          </Link>
        </div>
      </div>

      {/* ── Slide dots ── */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "clamp(1.5rem, 4vw, 6rem)",
          display: "flex",
          gap: "10px",
          zIndex: 20,
        }}
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === active ? "32px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: i === active ? "#C94227" : "rgba(245,241,232,0.4)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* ── Arrow controls ── */}
      {(["prev", "next"] as const).map((dir) => (
        <button
          key={dir}
          onClick={dir === "prev" ? prev : next}
          aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
          style={{
            position: "absolute",
            top: "50%",
            [dir === "prev" ? "left" : "right"]: "clamp(1rem, 2vw, 2.5rem)",
            transform: "translateY(-50%)",
            zIndex: 20,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(245,241,232,0.12)",
            border: "1.5px solid rgba(245,241,232,0.35)",
            color: "#F5F1E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(6px)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "#C94227";
            el.style.borderColor = "#C94227";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(245,241,232,0.12)";
            el.style.borderColor = "rgba(245,241,232,0.35)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {dir === "prev"
              ? <polyline points="15 18 9 12 15 6" />
              : <polyline points="9 18 15 12 9 6" />
            }
          </svg>
        </button>
      ))}

      {/* ── Slide count ── */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          right: "clamp(1.5rem, 4vw, 6rem)",
          zIndex: 20,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "rgba(245,241,232,0.6)",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
        }}
      >
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>
    </section>
  );
}
