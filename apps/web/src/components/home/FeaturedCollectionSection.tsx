/**
 * FeaturedCollectionSection — editorial split layout.
 *
 * Navy (var(--color-navy)) background for strong contrast.
 * Large image left (60%) + collection info right (40%).
 * Used as section 6 in homepage: "Featured Collection".
 */
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export function FeaturedCollectionSection() {
  return (
    <section
      aria-labelledby="featured-col-heading"
      style={{ backgroundColor: "var(--color-navy)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          minHeight: "80vh",
        }}
        className="fc-grid"
      >
        {/* Left — large image */}
        <div style={{ position: "relative", minHeight: "500px" }}>
          <Image
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85"
            alt="CULTRAVEN Street Collection — editorial campaign"
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            style={{ objectFit: "cover" }}
          />
          {/* Subtle right-side fade into navy panel */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, transparent 60%, var(--color-navy) 100%)",
            }}
          />
        </div>

        {/* Right — content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "clamp(3rem,6vw,7rem) clamp(2rem,5vw,6rem) clamp(3rem,6vw,7rem) 3rem",
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
            Featured Collection
          </span>

          <h2
            id="featured-col-heading"
            style={{
              fontFamily: "var(--font-heading)",
              
              fontSize: "clamp(2.5rem,5vw,5rem)",
              fontWeight: 600,
              color: "var(--color-cream)",
              lineHeight: 1.0,
              letterSpacing: "-0.01em",
              marginBottom: "1.5rem",
            }}
          >
            Street
          </h2>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9rem",
              lineHeight: 1.75,
              color: "rgba(245,241,232,0.65)",
              maxWidth: "340px",
              marginBottom: "2.5rem",
            }}
          >
            A collection built for movement, individuality and everyday
            rebellion. Washed textures. Clean silhouettes. Built different.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/collections/street"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem 2.25rem",
                backgroundColor: "var(--color-cream)",
                color: "var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "2px solid var(--color-cream)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.backgroundColor = "var(--color-crimson)";
                el.style.borderColor = "var(--color-crimson)";
                el.style.color = "var(--color-cream)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.backgroundColor = "var(--color-cream)";
                el.style.borderColor = "var(--color-cream)";
                el.style.color = "var(--color-navy)";
              }}
            >
              SHOP STREET
            </Link>
            <Link
              href="/collections"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem 2.25rem",
                backgroundColor: "transparent",
                color: "var(--color-cream)",
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "2px solid rgba(245,241,232,0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--color-cream)";
                el.style.backgroundColor = "rgba(245,241,232,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "rgba(245,241,232,0.4)";
                el.style.backgroundColor = "transparent";
              }}
            >
              ALL COLLECTIONS
            </Link>
          </div>

          {/* Collection stats */}
          <div
            style={{
              marginTop: "3rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(245,241,232,0.15)",
              display: "flex",
              gap: "2.5rem",
            }}
          >
            {[
              { num: "24", label: "Pieces" },
              { num: "6", label: "Colorways" },
              { num: "260gsm", label: "Fabric Weight" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.6rem",
                    fontWeight: 600,
                    color: "var(--color-cream)",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  {stat.num}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(245,241,232,0.45)",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fc-grid { grid-template-columns: 1fr !important; }
          .fc-grid > div:first-child { min-height: 320px !important; }
        }
      `}</style>
    </section>
  );
}
