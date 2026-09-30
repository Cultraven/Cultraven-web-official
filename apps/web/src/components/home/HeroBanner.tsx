"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { HeroSlide } from "@shop/types";

interface HeroBannerProps {
  slides: HeroSlide[];
  siteUrl?: string;
  // backward-compat: single slide
  slide?: HeroSlide;
}

const FALLBACK_SLIDE: HeroSlide = {
  id: "fallback",
  type: "image",
  srcDesktop: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1920&auto=format&fit=crop&q=80",
  srcMobile: "",
  altText: "CULTRAVEN Streetwear",
  headline: "Wear Your\nDifference.",
  subheadline: "260 GSM oversized heavyweights. Drops made for those who don't dress to fit in.",
  ctaLabel: "Shop the Drop",
  ctaHref: "/collections/new-in",
  textColor: "#FFFFFF",
  overlayOpacity: 0.45,
};

const DEFAULT_INTERVAL_MS = 5000;

export function HeroBanner({ slides: slidesProp, slide }: HeroBannerProps) {
  // normalize: accept array or single slide
  const slides = React.useMemo(() => {
    const arr = slidesProp?.length > 0 ? slidesProp : slide ? [slide] : [FALLBACK_SLIDE];
    return arr;
  }, [slidesProp, slide]);

  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((idx: number) => {
    setPrev(active);
    setActive(idx);
  }, [active]);

  const next = useCallback(() => {
    goTo((active + 1) % slides.length);
  }, [active, slides.length, goTo]);

  const previous = useCallback(() => {
    goTo((active - 1 + slides.length) % slides.length);
  }, [active, slides.length, goTo]);

  const activeDuration = slides[active]?.durationMs ?? DEFAULT_INTERVAL_MS;

  // Auto-advance (per-slide duration)
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setTimeout(next, activeDuration);
    return () => clearTimeout(timer);
  }, [slides.length, paused, next, activeDuration]);

  // Clear prev after transition
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 800);
    return () => clearTimeout(t);
  }, [prev]);

  return (
    <section
      aria-label="Campaign Hero"
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        minHeight: "560px",
        maxHeight: "900px",
        overflow: "hidden",
        backgroundColor: "var(--color-navy)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slides stack ─────────────────────────────────────────────────── */}
      {slides.map((s, i) => (
        <SlideLayer key={s.id} slide={s} index={i} visible={i === active} isPrev={i === prev} />
      ))}

      {/* ── Prev / Next arrows ───────────────────────────────────────────── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={previous}
            aria-label="Previous slide"
            style={{
              position: "absolute",
              left: "clamp(1rem,3vw,3rem)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20,
              width: "52px",
              height: "52px",
              background: "rgba(23,37,84,0.55)",
              border: "1.5px solid rgba(255,255,255,0.55)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(23,37,84,0.85)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(23,37,84,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={next}
            aria-label="Next slide"
            style={{
              position: "absolute",
              right: "clamp(1rem,3vw,3rem)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 20,
              width: "52px",
              height: "52px",
              background: "rgba(23,37,84,0.55)",
              border: "1.5px solid rgba(255,255,255,0.55)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(23,37,84,0.85)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(23,37,84,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* ── Dot indicators ───────────────────────────────────────────────── */}
      {slides.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === active ? "28px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: i === active ? "var(--color-lava)" : "rgba(255,255,255,0.45)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.35s ease, background 0.2s",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {slides.length > 1 && !paused && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            backgroundColor: "var(--color-lava)",
            zIndex: 20,
            animation: `heroProgress ${activeDuration}ms linear`,
            animationFillMode: "forwards",
          }}
          key={`progress-${active}`}
        />
      )}

      <style>{`
        @keyframes heroProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes heroScroll {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </section>
  );
}

// ─── Single slide layer (crossfade) ──────────────────────────────────────────

function SlideLayer({ slide: s, index, visible, isPrev }: { slide: HeroSlide; index: number; visible: boolean; isPrev: boolean }) {
  const overlayOpacity = s.overlayOpacity ?? 0.45;
  const headlineLines = (s.headline || "").split("\n");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visible ? 1 : isPrev ? 0 : 0,
        transition: visible ? "opacity 0.8s ease" : isPrev ? "opacity 0.8s ease" : "none",
        zIndex: visible ? 2 : isPrev ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Media — image (responsive <picture>), video (with poster fallback) */}
      <SlideMedia slide={s} index={index} visible={visible} />

      {/* Gradient overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: [
            `linear-gradient(to right, rgba(23,37,84,${overlayOpacity + 0.1}) 0%, rgba(23,37,84,${Math.max(0, overlayOpacity - 0.2)}) 55%, transparent 100%)`,
            `linear-gradient(to top, rgba(23,37,84,${overlayOpacity}) 0%, transparent 50%)`,
          ].join(", "),
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "clamp(2rem,5vw,5rem)",
          paddingBottom: "clamp(4rem,8vw,8rem)",
          maxWidth: "820px",
        }}
      >
        {/* Overline */}
        {s.eyebrow ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
          <span style={{ width: "32px", height: "2px", backgroundColor: "var(--color-lava)", display: "block", flexShrink: 0 }} />
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800,
            letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-lava)",
          }}>
            {s.eyebrow}
          </span>
        </div>
        ) : null}

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-heading)", fontWeight: 400,
          fontSize: "clamp(3.2rem,9vw,8rem)", lineHeight: 0.9,
          letterSpacing: "0.01em", textTransform: "uppercase",
          color: s.textColor || "#FFFFFF", marginBottom: "1.25rem",
        }}>
          {headlineLines.map((line, i) => (
            <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
          ))}
        </h1>

        {/* Sub copy */}
        {s.subheadline && (
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(0.85rem,1.4vw,1rem)",
            fontWeight: 500, color: "rgba(255,255,255,0.8)",
            marginBottom: "2rem", lineHeight: 1.6, maxWidth: "400px",
          }}>
            {s.subheadline}
          </p>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            href={s.ctaHref || "/collections/new-in"}
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.78rem",
              letterSpacing: "0.14em", textTransform: "uppercase",
              backgroundColor: "var(--color-lava)", color: "var(--color-navy)",
              padding: "14px 32px", border: "none", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "8px",
              transition: "background-color 0.2s, transform 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F0C310"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-lava)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            {s.ctaLabel || "Shop Now"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/collections/all"
            style={{
              fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem",
              letterSpacing: "0.14em", textTransform: "uppercase",
              backgroundColor: "transparent", color: "#FFFFFF",
              padding: "14px 28px", border: "1.5px solid rgba(255,255,255,0.55)",
              textDecoration: "none", display: "inline-flex", alignItems: "center",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.9)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.55)"}
          >
            View All
          </Link>
        </div>
      </div>

      {/* Scroll indicator (only on first/active slide) */}
      {visible && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", bottom: "2.5rem",
            right: "clamp(1.5rem,4vw,5rem)", zIndex: 10,
            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          }}
        >
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: "9px", fontWeight: 800,
            letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
            writingMode: "vertical-rl", transform: "rotate(180deg)",
          }}>
            Scroll
          </span>
          <div style={{ width: "1px", height: "48px", backgroundColor: "rgba(255,255,255,0.2)", position: "relative", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "40%", backgroundColor: "rgba(255,255,255,0.7)", animation: "heroScroll 1.8s ease-in-out infinite" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Slide media (image / video with safe fallbacks) ─────────────────────────

const MEDIA_STYLE = (objectPosition?: string): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: objectPosition || "center center",
  zIndex: 0,
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function SlideMedia({ slide: s, index, visible }: { slide: HeroSlide; index: number; visible: boolean }) {
  const isMobile = useIsMobile();
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const isVideo = s.type === "video" && !videoError && !!s.srcDesktop;
  const videoSrc = isMobile && s.srcMobile ? s.srcMobile : s.srcDesktop;
  const eager = index === 0;

  // Only the visible slide plays — saves bandwidth/CPU for the rest.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible) v.play().catch(() => setVideoError(true));
    else v.pause();
  }, [visible, videoSrc]);

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        key={videoSrc}
        muted
        loop
        playsInline
        autoPlay={eager}
        preload={eager ? "auto" : "metadata"}
        poster={s.posterSrc || undefined}
        aria-label={s.altText || undefined}
        onError={() => setVideoError(true)}
        style={MEDIA_STYLE(s.objectPosition)}
      >
        <source src={videoSrc} type={videoSrc.toLowerCase().split("?")[0].endsWith(".webm") ? "video/webm" : "video/mp4"} />
      </video>
    );
  }

  // Image slide, or video fallback → poster (video slides) / desktop image (image slides)
  const fallback = s.type === "video" ? s.posterSrc : s.srcDesktop;
  if (!fallback || imageError) return null; // navy section background shows — layout never breaks

  return (
    <picture>
      {s.type !== "video" && s.srcMobile ? <source media="(max-width: 768px)" srcSet={s.srcMobile} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallback}
        alt={s.altText || ""}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "auto"}
        onError={() => setImageError(true)}
        style={MEDIA_STYLE(s.objectPosition)}
      />
    </picture>
  );
}
