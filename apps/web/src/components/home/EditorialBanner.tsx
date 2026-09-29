"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { EditorialBanner as EditorialBannerType } from "@shop/types";

interface EditorialBannerProps {
  banner: EditorialBannerType;
}

export function EditorialBanner({ banner }: EditorialBannerProps) {
  return (
    <section style={{ backgroundColor: "#172545" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "70vh",
        }}
        className="editorial-grid"
      >
        {/* Left: Image */}
        <div style={{ position: "relative", minHeight: "500px" }}>
          <Image
            src={banner.imageSrc}
            alt={banner.imageAlt}
            fill
            sizes="50vw"
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Right: Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "clamp(3rem,6vw,7rem)",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#C94227",
              marginBottom: "1.25rem",
              display: "block",
            }}
          >
            {banner.tagline}
          </span>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(2.5rem,5vw,5rem)",
              lineHeight: 1.05,
              color: "#F5F1E8",
              marginBottom: "1.5rem",
            }}
          >
            {banner.headline}
          </h2>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "rgba(245,241,232,0.7)",
              maxWidth: "400px",
              marginBottom: "2.5rem",
            }}
          >
            Clean oversized essentials, washed textures and breathable styling built for daily movement.
          </p>

          <Link
            href={banner.ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem 2.25rem",
              border: "2px solid #F5F1E8",
              backgroundColor: "transparent",
              color: "#F5F1E8",
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              width: "fit-content",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "#F5F1E8";
              el.style.color = "#172545";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "transparent";
              el.style.color = "#F5F1E8";
            }}
          >
            {banner.ctaLabel}
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .editorial-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
