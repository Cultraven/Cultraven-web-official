"use client";

/**
 * FilmstripMarquee — continuously scrolling horizontal strip of campaign images.
 * Sits between the hero and the main content sections.
 * Pauses on hover. Images are a mix of streetwear/fashion editorial shots.
 */

import React from "react";

const FILMSTRIP_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN Campaign",
  },
  {
    src: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
    alt: "Streetwear Drop",
  },
  {
    src: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    alt: "Oversized Tee",
  },
  {
    src: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    alt: "Dharma Collection",
  },
  {
    src: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
    alt: "Cargo Campaign",
  },
  {
    src: "https://images.unsplash.com/photo-1525171254930-643fc658b64e?w=600&auto=format&fit=crop&q=80",
    alt: "Editorial Shot",
  },
  {
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    alt: "Lookbook",
  },
  {
    src: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=600&auto=format&fit=crop&q=80",
    alt: "Street Culture",
  },
  {
    src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    alt: "Raven Essentials",
  },
  {
    src: "https://images.unsplash.com/photo-1512411933099-b1d5565538e1?w=600&auto=format&fit=crop&q=80",
    alt: "Drop Campaign",
  },
];

// Duplicate once for seamless infinite loop (translateX -50%)
const TRACK = [...FILMSTRIP_IMAGES, ...FILMSTRIP_IMAGES];

export function FilmstripMarquee() {
  return (
    <div
      className="filmstrip-root"
      style={{
        width: "100%",
        backgroundColor: "var(--color-raven)",
        overflow: "hidden",
        height: "clamp(140px, 18vw, 240px)",
        display: "flex",
        alignItems: "stretch",
        position: "relative",
      }}
    >
      {/* Left label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          paddingInline: "1.5rem",
          background: "linear-gradient(to right, var(--color-raven) 60%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(245,241,232,0.45)",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          The Drop
        </span>
      </div>

      {/* Scrolling track */}
      <div
        className="filmstrip-track"
        style={{
          display: "flex",
          gap: "4px",
          animation: "filmstripScroll 35s linear infinite",
          willChange: "transform",
          alignItems: "stretch",
        }}
      >
        {TRACK.map((img, i) => (
          <div
            key={i}
            style={{
              width: "clamp(140px, 14vw, 220px)",
              flexShrink: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "brightness(0.88) contrast(1.05)",
                transition: "transform 0.4s ease, filter 0.3s ease",
              }}
              className="filmstrip-img"
            />
          </div>
        ))}
      </div>

      {/* Right fade */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "80px",
          background: "linear-gradient(to left, var(--color-raven) 30%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      <style>{`
        @keyframes filmstripScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .filmstrip-root:hover .filmstrip-track {
          animation-play-state: paused;
        }
        .filmstrip-root:hover .filmstrip-img {
          filter: brightness(1) contrast(1.05) !important;
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
