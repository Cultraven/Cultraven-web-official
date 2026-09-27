/**
 * CommunitySection — "WORN BY THE CULTURE" social/UGC grid.
 *
 * 6-image editorial grid of lifestyle photography.
 * Instagram handle CTA at the top right.
 * Clean mist (#EAE6DB) background, no heavy UI chrome.
 */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface UGCImage {
  id: string;
  src: string;
  alt: string;
  span?: "wide" | "tall";
}

const UGC_IMAGES: UGCImage[] = [
  {
    id: "ugc-1",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN community look — oversized tee",
    span: "tall",
  },
  {
    id: "ugc-2",
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN community look — streetwear",
  },
  {
    id: "ugc-3",
    src: "https://images.unsplash.com/photo-1529139574466-a303027814a5?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN community — editorial",
  },
  {
    id: "ugc-4",
    src: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN cargo look",
    span: "wide",
  },
  {
    id: "ugc-5",
    src: "https://images.unsplash.com/photo-1503341341355-6b1f2d7b8640?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN graphic tee",
  },
  {
    id: "ugc-6",
    src: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=600&auto=format&fit=crop&q=80",
    alt: "CULTRAVEN hoodie street style",
  },
];

export function CommunitySection() {
  return (
    <section
      aria-labelledby="community-heading"
      style={{ backgroundColor: "#EAE6DB", padding: "clamp(4rem,8vw,8rem) 0" }}
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
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#C94227",
                marginBottom: "0.6rem",
              }}
            >
              Community
            </span>
            <h2
              id="community-heading"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                fontWeight: 600,
                color: "#172545",
                lineHeight: 1,
              }}
            >
              Worn by the Culture.
            </h2>
          </div>

          <Link
            href="https://www.instagram.com/cultraven"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#172545",
              borderBottom: "2px solid #172545",
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
            @CULTRAVEN
          </Link>
        </div>

        {/* Image grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridAutoRows: "260px",
            gap: "0.75rem",
          }}
          className="ugc-grid"
        >
          {UGC_IMAGES.map((img) => (
            <UGCTile key={img.id} image={img} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#6B7280",
              letterSpacing: "0.06em",
              marginBottom: "1.25rem",
            }}
          >
            Tag{" "}
            <strong style={{ color: "#172545" }}>@cultraven</strong> to be featured
          </p>
          <Link
            href="https://www.instagram.com/cultraven"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.875rem 2.25rem",
              border: "2px solid #172545",
              backgroundColor: "transparent",
              color: "#172545",
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "#172545";
              el.style.color = "#F5F1E8";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "transparent";
              el.style.color = "#172545";
            }}
          >
            FOLLOW US ON INSTAGRAM
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ugc-grid { grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 200px !important; }
        }
        @media (max-width: 480px) {
          .ugc-grid { grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 160px !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Single UGC Tile ───────────────────────────────────────────────────────────

function UGCTile({ image }: { image: UGCImage }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#D9D3C4",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        style={{
          objectFit: "cover",
          transition: "transform 0.6s ease",
          transform: hovered ? "scale(1.06)" : "scale(1)",
        }}
      />

      {/* Hover overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(23,37,69,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F5F1E8"
            strokeWidth="1.5"
            style={{ marginBottom: "8px", margin: "0 auto 8px" }}
          >
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="#F5F1E8" stroke="none" />
          </svg>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#F5F1E8",
            }}
          >
            @CULTRAVEN
          </p>
        </div>
      </div>
    </div>
  );
}
