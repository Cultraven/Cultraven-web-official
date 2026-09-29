/**
 * FeaturedCollectionSection — editorial split layout.
 *
 * Navy (#172545) background for strong contrast.
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
      style={{ backgroundColor: "#172545" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          minHeight: "80vh",
          maxWidth: "1600px",
          margin: "0 auto",
          width: "100%",
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
                "linear-gradient(to right, transparent 60%, #172545 100%)",
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
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C94227",
              marginBottom: "1.5rem",
            }}
          >
            Featured Collection
          </span>

          <h2
            id="featured-col-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(2.5rem,5vw,5rem)",
              fontWeight: 600,
              color: "#F5F1E8",
              lineHeight: 1.0,
              letterSpacing: "-0.01em",
              marginBottom: "1.5rem",
            }}
          >
            Street
          </h2>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
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
                backgroundColor: "#F5F1E8",
                color: "#172545",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
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
                color: "#F5F1E8",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "2px solid rgba(245,241,232,0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "#F5F1E8";
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
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "1.6rem",
                    fontWeight: 600,
                    color: "#F5F1E8",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  {stat.num}
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
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
