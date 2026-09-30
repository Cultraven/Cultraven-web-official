"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Category nav strip (GenRage / LP style) ─────────────────────────────────
const NAV_CATS = [
  { id: "new-in",     label: "New In",     href: "/collections/new-in" },
  { id: "t-shirts",   label: "T-Shirts",   href: "/collections/t-shirts" },
  { id: "hoodies",    label: "Hoodies",    href: "/collections/hoodies" },
  { id: "sweatshirts",label: "Sweatshirts",href: "/collections/sweatshirts" },
  { id: "cargos",     label: "Cargos",     href: "/collections/cargos" },
  { id: "jeans",      label: "Jeans",      href: "/collections/jeans" },
  { id: "outerwear",  label: "Outerwear",  href: "/collections/outerwear" },
  { id: "sale",       label: "Sale",       href: "/collections/sale", accent: true },
];

// ─── Image tiles (LP-editorial bento) ────────────────────────────────────────
interface Tile {
  id: string;
  title: string;
  sub: string;
  href: string;
  image: string;
  wide?: boolean;
  tall?: boolean;
}

const TILES: Tile[] = [
  {
    id: "tees",
    title: "Oversized Tees",
    sub: "From ₹1,499",
    href: "/collections/t-shirts",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=85",
    tall: true,
  },
  {
    id: "hoodies",
    title: "Hoodies",
    sub: "From ₹2,499",
    href: "/collections/hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=900&auto=format&fit=crop&q=85",
  },
  {
    id: "bottoms",
    title: "Cargos & Jeans",
    sub: "From ₹1,999",
    href: "/collections/cargos",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop&q=85",
  },
  {
    id: "outerwear",
    title: "Outerwear",
    sub: "From ₹3,499",
    href: "/collections/outerwear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=85",
    wide: true,
  },
];

export function CategoryTiles() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("new-in");

  return (
    <section
      aria-labelledby="cat-heading"
      style={{
        backgroundColor: "var(--color-cream)",
        borderTop: "1px solid var(--color-line)",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      {/* ── Horizontal Category Strip (GenRage / LP style) ─────────────────── */}
      <div
        style={{
          borderBottom: "1px solid var(--color-line)",
          position: "relative",
        }}
      >
        <div
          ref={stripRef}
          className="hide-scrollbar"
          style={{
            display: "flex",
            overflowX: "auto",
            paddingInline: "clamp(1rem,4vw,5rem)",
            gap: "0",
          }}
        >
          {NAV_CATS.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              onClick={() => setActive(cat.id)}
              style={{
                flexShrink: 0,
                padding: "1rem 1.25rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.78rem",
                fontWeight: active === cat.id ? 900 : 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: cat.accent ? "var(--color-lava)" : active === cat.id ? "var(--color-navy)" : "var(--color-smoke)",
                borderBottom: active === cat.id ? "2px solid var(--color-navy)" : "2px solid transparent",
                whiteSpace: "nowrap",
                transition: "color 0.2s ease, border-color 0.2s ease",
                textDecoration: "none",
              }}
              onMouseEnter={e => {
                if (active !== cat.id) (e.currentTarget as HTMLElement).style.color = "var(--color-navy)";
              }}
              onMouseLeave={e => {
                if (active !== cat.id) (e.currentTarget as HTMLElement).style.color = cat.accent ? "var(--color-lava)" : "var(--color-smoke)";
              }}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Editorial Image Grid (LP-style clean tiles) ─────────────────────── */}
      <div style={{ padding: "clamp(2.5rem,5vw,5rem) clamp(1rem,4vw,5rem)" }}>
        {/* Section heading */}
        <div style={{ marginBottom: "2rem" }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--color-lava)",
              marginBottom: "0.5rem",
            }}
          >
            Shop By Category
          </span>
          <h2
            id="cat-heading"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem,4.5vw,3.5rem)",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: "var(--color-navy)",
              lineHeight: 0.95,
            }}
          >
            The Collection
          </h2>
        </div>

        {/* LP-clean image grid */}
        <div className="cat-grid">
          {TILES.map((tile) => (
            <TileCard key={tile.id} tile={tile} />
          ))}
        </div>
      </div>

      <style>{`
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: 340px 240px;
          gap: 12px;
        }
        .cat-grid > *:nth-child(1) { grid-row: span 2; }
        .cat-grid > *:nth-child(4) { grid-column: span 2; }

        @media (max-width: 900px) {
          .cat-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
          }
          .cat-grid > *:nth-child(1) { grid-row: span 1; aspect-ratio: 3/4; }
          .cat-grid > *:nth-child(4) { grid-column: span 2; aspect-ratio: 16/7; }
        }
        @media (max-width: 600px) {
          .cat-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }
          .cat-grid > * { aspect-ratio: 4/3 !important; }
          .cat-grid > *:nth-child(1) { aspect-ratio: 4/3 !important; }
          .cat-grid > *:nth-child(4) { grid-column: span 1; }
        }
      `}</style>
    </section>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={tile.href}
      className="cat-tile"
      style={{
        position: "relative",
        display: "block",
        overflow: "hidden",
        backgroundColor: "var(--color-bone)",
        aspectRatio: tile.wide ? undefined : "auto",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Image
        src={tile.image}
        alt={tile.title}
        fill
        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
        style={{
          objectFit: "cover",
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Gradient — subtle bottom fade (LP style) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(23,37,84,0.72) 0%, rgba(23,37,84,0.12) 50%, transparent 100%)",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Text */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "clamp(1rem,2vw,1.5rem)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 400,
            fontSize: "clamp(1.1rem,2.2vw,1.6rem)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "#FFFFFF",
            lineHeight: 1.1,
            marginBottom: "4px",
          }}
        >
          {tile.title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          {tile.sub}
        </p>
      </div>

      {/* LP-style "SHOP NOW" pill on hover */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          backgroundColor: "rgba(249,248,246,0.95)",
          color: "var(--color-navy)",
          fontFamily: "var(--font-sans)",
          fontWeight: 800,
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "6px 12px",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        Shop →
      </div>
    </Link>
  );
}
