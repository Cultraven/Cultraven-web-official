/**
 * BestsellersSection — "THE ONES EVERYONE WANTS."
 *
 * Horizontal snap-scroll carousel of 6 bestselling products.
 * Mist (var(--color-mist)) background for section alternation.
 * Cards are the shared ShopCard (price + % off, sizes on hover, wishlist).
 */
"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ShopCard } from "@/components/shop/ShopCard";
import type { CardProduct } from "@/lib/card-info";

export interface BestProduct extends CardProduct {
  badge?: "BESTSELLER" | "LOW STOCK";
}

// ─── Section ──────────────────────────────────────────────────────────────────

export interface BestsellersContent { eyebrow?: string; heading: string }

/** Heading comes from home.bestsellers; products are the database products flagged "Bestseller". */
export function BestsellersSection({ content, products }: { content: BestsellersContent; products: BestProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" });
  };

  return (
    <section
      className="cv-auto"
      aria-labelledby="bs-heading"
      style={{ backgroundColor: "var(--color-mist)", padding: "clamp(4rem,8vw,8rem) 0" }}
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
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--color-crimson)",
                marginBottom: "0.6rem",
              }}
            >
              {content.eyebrow}
            </span>
            <h2
              id="bs-heading"
              style={{
                fontFamily: "var(--font-heading)",
                
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                fontWeight: 600,
                color: "var(--color-navy)",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {content.heading}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              href="/collections/bestsellers"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-navy)",
                borderBottom: "2px solid var(--color-navy)",
                paddingBottom: "2px",
                marginRight: "1rem",
              }}
            >
              VIEW ALL
            </Link>
            {/* Scroll arrows */}
            {(["left", "right"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-navy)",
                  background: "transparent",
                  color: "var(--color-navy)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-navy)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-cream)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)";
                }}
              >
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
                  {dir === "left" ? (
                    <polyline points="15 18 9 12 15 6" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: "1.25rem",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            width: "100%",
          }}
          className="bs-scroll"
        >
          {products.map((p, i) => (
            <div key={p.id} className="bs-card" style={{ flexShrink: 0, width: "clamp(200px, 22vw, 290px)", scrollSnapAlign: "start", display: "flex", flexDirection: "column", padding: "0 4px 6px 0" }}>
              <ShopCard product={p} priority={i < 3} />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
