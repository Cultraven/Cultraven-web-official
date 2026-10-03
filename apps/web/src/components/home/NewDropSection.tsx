/**
 * NewDropSection — LP-editorial product grid immediately after hero.
 *
 * 4-col desktop / 2-col mobile.
 * Cards are the shared ShopCard (price + % off, sizes on hover, wishlist).
 */
"use client";

import React from "react";
import Link from "next/link";
import { ShopCard } from "@/components/shop/ShopCard";
import type { CardProduct } from "@/lib/card-info";

export interface DropProduct extends CardProduct {
  isNew?: boolean;
}

// ─── Section ──────────────────────────────────────────────────────────────────

export interface NewDropContent { eyebrow?: string; heading: string; ctaLabel?: string; ctaHref?: string }

/** Heading comes from home.newDrop; products are the database products flagged "New arrival". */
export function NewDropSection({ content, products }: { content: NewDropContent; products: DropProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="new-drop-heading"
      style={{
        backgroundColor: "var(--color-cream)",
        padding: "clamp(4rem,7vw,7rem) 0",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)" }}>

        {/* ── Editorial Header (LP style) ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            gap: "1rem",
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
                color: "var(--color-lava)",
                marginBottom: "0.6rem",
                cursor: "default",
                userSelect: "none",
              }}
            >
              {content.eyebrow}
            </span>
            <h2
              id="new-drop-heading"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.2rem,4.5vw,4rem)",
                fontWeight: 400,
                color: "var(--color-navy)",
                lineHeight: 0.95,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                cursor: "default",
                userSelect: "none",
              }}
            >
              {content.heading}
            </h2>
          </div>

          {content.ctaLabel && content.ctaHref ? (
          <Link
            href={content.ctaHref}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderBottom: "1.5px solid var(--color-navy)",
              paddingBottom: "2px",
              whiteSpace: "nowrap",
              transition: "color 0.2s ease, border-color 0.2s ease",
            }}
          >
            {content.ctaLabel}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          ) : null}
        </div>

        {/* ── Product Grid ────────────────────────────────────────────────── */}
        <div className="nd-grid">
          {products.map((p, i) => (
            <ShopCard key={p.id} product={{ ...p, isNewArrival: true }} priority={i < 4} />
          ))}
        </div>
      </div>

    </section>
  );
}
