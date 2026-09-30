/**
 * NewDropSection — LP-editorial product grid immediately after hero.
 *
 * 4-col desktop / 2-col mobile.
 * Clean product cards: no borders on images, LP-style hover, color swatches.
 */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

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

const fallbackProducts: DropProduct[] = [
  {
    id: "nd-1",
    title: "Raven Oversized Tee — Acid Black",
    href: "/products/raven-oversized-tee-acid-black",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=700&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=700&auto=format&fit=crop&q=85",
    pricePaise: 199900,
    mrpPaise: 249900,
    colors: [{ hex: "#0A0A0A", label: "Acid Black" }, { hex: "#2C2C2C", label: "Charcoal" }, { hex: "#DAB205", label: "Flame" }],
    isNew: true,
  },
  {
    id: "nd-2",
    title: "Dharma Graphic Hoodie — Stone Wash",
    href: "/products/dharma-graphic-hoodie-stone",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1512411933099-b1d5565538e1?w=700&auto=format&fit=crop&q=85",
    pricePaise: 299900,
    mrpPaise: 399900,
    colors: [{ hex: "#EDE3CF", label: "Stone" }, { hex: "#172554", label: "Navy" }, { hex: "#7A7468", label: "Ash" }],
    isNew: true,
  },
  {
    id: "nd-3",
    title: "Raven Cargo — Military Olive",
    href: "/products/raven-cargo-military-olive",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=700&auto=format&fit=crop&q=85",
    pricePaise: 249900,
    mrpPaise: 299900,
    colors: [{ hex: "#556B2F", label: "Olive" }, { hex: "#172554", label: "Navy" }, { hex: "#0A0A0A", label: "Black" }],
    isNew: true,
    badge: "LIMITED",
  },
  {
    id: "nd-4",
    title: "Acid State Sweatshirt — Washed Grey",
    href: "/products/acid-state-sweatshirt-washed-grey",
    image: "https://images.unsplash.com/photo-1578681994506-b8f463449011?w=700&auto=format&fit=crop&q=85",
    hoverImage: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=700&auto=format&fit=crop&q=85",
    pricePaise: 249900,
    mrpPaise: 299900,
    colors: [{ hex: "#9CA3AF", label: "Washed Grey" }, { hex: "#0A0A0A", label: "Black" }, { hex: "#EDE3CF", label: "Cream" }],
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
          const mapped = data.products
            .filter((p: any) => p.pricePaise != null)
            .slice(0, 4)
            .map((p: any) => ({
              id: p.id || p._id,
              title: p.title,
              href: `/products/${p.slug || p.id}`,
              image: p.image || fallbackProducts[0].image,
              hoverImage: p.hoverImage || p.image || fallbackProducts[0].hoverImage,
              pricePaise: p.pricePaise,
              mrpPaise: p.mrpPaise || p.pricePaise,
              colors: Array.isArray(p.colors)
                ? p.colors.filter((c: any) => c && typeof c.hex === "string").map((c: any) => ({ hex: String(c.hex), label: String(c.label) }))
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
              }}
            >
              Just Landed
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
              }}
            >
              New Drop
            </h2>
          </div>

          <Link
            href="/collections/new-in"
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
            View All New In
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* ── Product Grid ────────────────────────────────────────────────── */}
        <div className="nd-grid">
          {products.map((p) => (
            <NewDropCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <style>{`
        .nd-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: clamp(1rem, 1.5vw, 1.5rem);
        }
        @media (max-width: 1024px) { .nd-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 680px)  { .nd-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; } }
      `}</style>
    </section>
  );
}

// ─── LP-Editorial Product Card ────────────────────────────────────────────────

function NewDropCard({ product: p }: { product: DropProduct }) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const slug = p.href.replace(/^\/products\//, "");

  const disc = p.mrpPaise > p.pricePaise
    ? Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100)
    : 0;

  return (
    <article
      style={{ display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image (LP-clean: no border, no harsh shadow) ─────────────────── */}
      <Link
        href={p.href}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "4/5",
          maxHeight: "clamp(200px, 26vw, 360px)",
          overflow: "hidden",
          backgroundColor: "var(--color-bone)",
          marginBottom: "0.9rem",
        }}
        tabIndex={0}
        aria-label={p.title}
      >
        {/* Badges — top left */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {p.isNew && (
            <span
              style={{
                backgroundColor: "var(--color-navy)",
                color: "#FFFFFF",
                fontFamily: "var(--font-sans)",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "3px 8px",
              }}
            >
              NEW
            </span>
          )}
          {p.badge && (
            <span
              style={{
                backgroundColor: "var(--color-lava)",
                color: "var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "3px 8px",
              }}
            >
              {p.badge}
            </span>
          )}
          {disc >= 5 && !p.badge && (
            <span
              style={{
                backgroundColor: "var(--color-navy)",
                color: "#FFFFFF",
                fontFamily: "var(--font-sans)",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "3px 8px",
              }}
            >
              {disc}% OFF
            </span>
          )}
        </div>

        {/* Wishlist — top right */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(w => !w); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 10,
            background: "rgba(249,248,246,0.92)",
            border: "none",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: hovered || wishlisted ? 1 : 0,
            transform: hovered || wishlisted ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={wishlisted ? "var(--color-lava)" : "none"}
            stroke={wishlisted ? "var(--color-lava)" : "var(--color-navy)"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Product image — LP hover zoom */}
        <Image
          src={hovered ? p.hoverImage : p.image}
          alt={p.title}
          fill
          sizes="(max-width: 680px) 50vw, 25vw"
          style={{
            objectFit: "cover",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        />

        {/* Quick Add — LP-style slides up on hover */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0.625rem",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.25s ease",
            zIndex: 10,
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({
                productId: p.id,
                slug,
                title: p.title,
                image: p.image,
                sku: `${p.id}-free`,
                size: "Free Size",
                color: p.colors?.[0]?.label ?? "Default",
                pricePaise: p.pricePaise,
                mrpPaise: p.mrpPaise,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: added ? "var(--color-lava)" : "rgba(249,248,246,0.97)",
              color: added ? "var(--color-navy)" : "var(--color-navy)",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {added ? "ADDED ✓" : "QUICK ADD"}
          </button>
        </div>
      </Link>

      {/* ── Product Info (LP-clean) ──────────────────────────────────────── */}
      <div style={{ paddingInline: "2px" }}>
        {/* Color swatches */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "7px" }} aria-label="Available colors">
          {(p.colors ?? []).filter(c => c?.hex).map(c => (
            <div
              key={c.hex}
              title={c.label}
              style={{
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                backgroundColor: c.hex,
                border: "1.5px solid rgba(23,37,84,0.2)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Name */}
        <Link
          href={p.href}
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--color-navy)",
            marginBottom: "5px",
            lineHeight: 1.4,
            textDecoration: "none",
          }}
        >
          {p.title}
        </Link>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.88rem",
              color: "var(--color-navy)",
            }}
          >
            {fmt(p.pricePaise)}
          </span>
          {disc >= 5 && (
            <>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  color: "var(--color-smoke)",
                  textDecoration: "line-through",
                }}
              >
                {fmt(p.mrpPaise)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  color: "var(--color-lava)",
                  letterSpacing: "0.04em",
                }}
              >
                {disc}% off
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
