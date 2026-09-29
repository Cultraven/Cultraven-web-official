/**
 * NewDropSection — editorial product grid immediately after hero.
 *
 * Heading: "NEW DROP" / "THE LATEST FROM CULTRAVEN."
 * 4-column desktop, 2-column mobile.
 * Full product card: hover swap, wishlist, quick-add, color dots, badges.
 */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface DropProduct {
  id: string;
  title: string;
  href: string;
  image: string;
  hoverImage: string;
  pricePaise: number;
  mrpPaise: number;
  colors: { hex: string; label: string }[];
  isNew?: boolean;
  badge?: string;
}

const fallbackProducts = [
  {
    id: "nd-1",
    title: "RAVEN OVERSIZED TEE — ACID BLACK",
    href: "/products/raven-oversized-tee-acid-black",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
    pricePaise: 199900,
    mrpPaise: 249900,
    colors: [
      { hex: "#0A0A0A", label: "Acid Black" },
      { hex: "#2C2C2C", label: "Charcoal" },
      { hex: "#C94227", label: "Flame" },
    ],
    isNew: true,
  },
  {
    id: "nd-2",
    title: "DHARMA GRAPHIC HOODIE — STONE WASH",
    href: "/products/dharma-graphic-hoodie-stone",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1512411933099-b1d5565538e1?w=600&auto=format&fit=crop&q=80",
    pricePaise: 299900,
    mrpPaise: 399900,
    colors: [
      { hex: "#EAE6DB", label: "Stone" },
      { hex: "#172545", label: "Navy" },
      { hex: "#6B7280", label: "Ash" },
    ],
    isNew: true,
  },
  {
    id: "nd-3",
    title: "CARGO WIDE LEG — MILITARY OLIVE",
    href: "/products/cargo-wide-leg-military-olive",
    image:
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80",
    pricePaise: 349900,
    mrpPaise: 499900,
    colors: [
      { hex: "#556B2F", label: "Olive" },
      { hex: "#172545", label: "Navy" },
      { hex: "#0A0A0A", label: "Black" },
    ],
    isNew: true,
    badge: "LIMITED",
  },
  {
    id: "nd-4",
    title: "ACID STATE SWEATSHIRT — WASHED GREY",
    href: "/products/acid-state-sweatshirt-washed-grey",
    image:
      "https://images.unsplash.com/photo-1578681994506-b8f463449011?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600&auto=format&fit=crop&q=80",
    pricePaise: 249900,
    mrpPaise: 299900,
    colors: [
      { hex: "#9CA3AF", label: "Washed Grey" },
      { hex: "#0A0A0A", label: "Black" },
      { hex: "#EAE6DB", label: "Cream" },
    ],
    isNew: true,
  },
];

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

// ─── Section ──────────────────────────────────────────────────────────────────

export function NewDropSection() {
  const [products, setProducts] = React.useState<DropProduct[]>(fallbackProducts);

  React.useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          const mapped = data.products.slice(0, 4).map((p: any) => ({
            id: p.id || p._id,
            title: p.title,
            href: `/products/${p.slug || p.id}`,
            image: p.image || fallbackProducts[0].image,
            hoverImage: p.hoverImage || p.image || fallbackProducts[0].hoverImage,
            pricePaise: p.pricePaise || 199900,
            mrpPaise: p.mrpPaise || 249900,
            colors: Array.isArray(p.colors)
              ? p.colors
                  .filter((c: any) => c && typeof c.hex === "string" && typeof c.label === "string")
                  .map((c: any) => ({ hex: String(c.hex), label: String(c.label) }))
              : [{ hex: "#0A0A0A", label: "Black" }],
            isNew: true,
          }));
          setProducts(mapped);
        }
      })
      .catch(console.error);
  }, []);
  return (
    <section
      aria-labelledby="new-drop-heading"
      style={{ backgroundColor: "#F5F1E8", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <span
            style={{
              display: "block",
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C94227",
              marginBottom: "0.75rem",
            }}
          >
            Just Landed
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h2
              id="new-drop-heading"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(2.5rem,5.5vw,4.5rem)",
                fontWeight: 600,
                color: "#172545",
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
              }}
            >
              New Drop
            </h2>

            <Link
              href="/collections/new-in"
              style={{
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
              VIEW ALL NEW IN
            </Link>
          </div>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#6B7280",
              marginTop: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            THE LATEST FROM CULTRAVEN.
          </p>
        </div>

        {/* Product Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            justifyContent: "center",
            gap: "1.25rem",
          }}
          className="nd-grid"
        >
          {products.map((p) => (
            <NewDropCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .nd-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 768px)  { .nd-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; } }
      `}</style>
    </section>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────

function NewDropCard({ product: p }: { product: DropProduct }) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const disc = Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100);

  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image container ── */}
      <Link
        href={p.href}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "3/4",
          overflow: "hidden",
          backgroundColor: "#EAE6DB",
          marginBottom: "0.85rem",
        }}
      >
        {/* Badges */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {p.isNew && (
            <span
              style={{
                backgroundColor: "#172545",
                color: "#F5F1E8",
                fontFamily: "Inter, sans-serif",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "4px 8px",
                display: "block",
              }}
            >
              NEW
            </span>
          )}
          {p.badge && (
            <span
              style={{
                backgroundColor: "#C94227",
                color: "#F5F1E8",
                fontFamily: "Inter, sans-serif",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "4px 8px",
                display: "block",
              }}
            >
              {p.badge}
            </span>
          )}
          {disc > 0 && !p.badge && (
            <span
              style={{
                backgroundColor: "#C94227",
                color: "#F5F1E8",
                fontFamily: "Inter, sans-serif",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "4px 8px",
                display: "block",
              }}
            >
              {disc}% OFF
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((w) => !w);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            background: "rgba(245,241,232,0.92)",
            border: "none",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            opacity: hovered || wishlisted ? 1 : 0,
            transform: hovered ? "scale(1)" : "scale(0.85)",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={wishlisted ? "#C94227" : "none"}
            stroke={wishlisted ? "#C94227" : "#172545"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Product image — swaps on hover */}
        <Image
          src={hovered ? p.hoverImage : p.image}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{
            objectFit: "cover",
            transition: "opacity 0.35s ease, transform 0.65s ease",
            transform: hovered ? "scale(1.04)" : "scale(1)",
          }}
        />

        {/* Quick Add — slides up on hover */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0.75rem",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.28s ease",
            zIndex: 10,
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: added ? "#C94227" : "#172545",
              color: "#F5F1E8",
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {added ? "ADDED \u2713" : "QUICK ADD"}
          </button>
        </div>
      </Link>

      {/* ── Product info ── */}
      <div>
        {/* Color swatches */}
        <div
          style={{ display: "flex", gap: "6px", marginBottom: "8px" }}
          aria-label="Available colors"
        >
          {(p.colors ?? []).filter((c) => c?.hex).map((c) => (
            <div
              key={c.hex}
              title={c.label}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: c.hex,
                border: "1.5px solid rgba(23,37,69,0.25)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        <Link
          href={p.href}
          style={{
            display: "block",
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#172545",
            marginBottom: "6px",
            lineHeight: 1.35,
          }}
        >
          {p.title}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#172545",
            }}
          >
            {fmt(p.pricePaise)}
          </span>
          {disc > 0 && (
            <>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  color: "#6B7280",
                  textDecoration: "line-through",
                }}
              >
                {fmt(p.mrpPaise)}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  color: "#C94227",
                  letterSpacing: "0.04em",
                }}
              >
                {disc}% off
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
