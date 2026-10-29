import React from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
import "./CategoryTiles.css";

export interface StripItem { id: string; label: string; href: string; accent?: boolean }
export interface Tile { id: string; title: string; sub?: string; href: string; image: string; size?: "normal" | "tall" | "wide"; /** Which part of the photo stays in view when it is cropped: Top, Middle or Bottom (Auto/empty = the site decides). */ focus?: string }

/** Admin choice -> CSS object-position. Anything else (including "Auto") leaves the site default. */
export const TILE_FOCUS: Record<string, string> = { Top: "50% 12%", Middle: "50% 50%", Bottom: "50% 88%" };

/** Strip + tiles are loaded from the database (home.categoryStrip / home.categoryTiles). */
export function CategoryTiles({ strip, tiles }: { strip: StripItem[]; tiles: Tile[] }) {
  return (
    <section
      className="cv-auto"
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
          className="hide-scrollbar"
          style={{
            display: "flex",
            overflowX: "auto",
            paddingInline: "clamp(1rem,4vw,5rem)",
            gap: "0",
          }}
        >
          {strip.map((cat) => (
            <Link key={cat.id} href={cat.href} className={`cat-strip-link${cat.accent ? " is-accent" : ""}`}>
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
          {tiles.map((tile) => (
            <TileCard key={tile.id} tile={tile} />
          ))}
        </div>
      </div>

    </section>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  return (
    <Link
      href={tile.href}
      className={`cat-tile hv cat-tile-${tile.size ?? "normal"}`}
      style={{
        ...(tile.focus && TILE_FOCUS[tile.focus] ? ({ "--cat-pos": TILE_FOCUS[tile.focus] } as React.CSSProperties) : {}),
        position: "relative",
        display: "block",
        overflow: "hidden",
        backgroundColor: "var(--color-bone)",
        aspectRatio: "auto",
      }}
    >
      {/* Image */}
      <Image
        src={tile.image}
        alt={tile.title}
        fill
        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="hv-zoom"
        style={{ objectFit: "cover" }}
      />

      {/* Label: plain white text on the photo (a soft fade at the bottom keeps it readable). */}
      <div className="cat-label">
        <p className="cat-label-title">{tile.title}</p>
        {tile.sub ? <p className="cat-label-sub">{tile.sub}</p> : null}
      </div>

      {/* LP-style "SHOP NOW" pill on hover */}
      <div
        className="hv-pill"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          backgroundColor: "var(--color-navy)",
          border: "2px solid var(--color-navy)",
          boxShadow: "3px 3px 0 0 var(--color-lava)",
          color: "var(--color-cream)",
          fontFamily: "var(--font-sans)",
          fontWeight: 800,
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "6px 12px",
        }}
      >
        Shop →
      </div>
    </Link>
  );
}
