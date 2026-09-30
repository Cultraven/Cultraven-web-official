"use client";

import React from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
import type { EditorialBanner as EditorialBannerType } from "@shop/types";

interface EditorialBannerProps {
  banner: EditorialBannerType;
}

export function EditorialBanner({ banner }: EditorialBannerProps) {
  return (
    <section style={{ backgroundColor: "var(--color-navy)" }}>
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
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-crimson)",
              marginBottom: "1.25rem",
              display: "block",
            }}
          >
            {banner.tagline}
          </span>

          <h2
            style={{
              fontFamily: "var(--font-heading)",
              
              fontWeight: 400,
              fontSize: "clamp(2.5rem,5vw,5rem)",
              lineHeight: 1.05,
              color: "var(--color-cream)",
              marginBottom: "1.5rem",
            }}
          >
            {banner.headline}
          </h2>



          {banner.ctaLabel ? (
          <Link
            href={banner.ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem 2.25rem",
              border: "2px solid var(--color-cream)",
              backgroundColor: "transparent",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              width: "fit-content",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "var(--color-cream)";
              el.style.color = "var(--color-navy)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.backgroundColor = "transparent";
              el.style.color = "var(--color-cream)";
            }}
          >
            {banner.ctaLabel}
          </Link>
          ) : null}
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
