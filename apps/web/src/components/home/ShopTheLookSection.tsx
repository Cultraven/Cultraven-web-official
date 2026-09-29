/**
 * ShopTheLookSection — editorial model image + shoppable product sidebar.
 *
 * Layout: large model image (left 55%) + stacked product cards (right 45%).
 * Each product has: image, name, price, color, "ADD TO BAG" button.
 * Responsive: stacks vertically on mobile.
 */
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface LookProduct {
  id: string;
  title: string;
  category: string;
  href: string;
  image: string;
  pricePaise: number;
  color: string;
}

const LOOK_PRODUCTS: LookProduct[] = [
  {
    id: "look-1",
    title: "RAVEN OVERSIZED TEE — ACID BLACK",
    category: "T-SHIRT",
    href: "/products/raven-oversized-tee-acid-black",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80",
    pricePaise: 199900,
    color: "Acid Black",
  },
  {
    id: "look-2",
    title: "CARGO WIDE LEG — MILITARY OLIVE",
    category: "CARGO",
    href: "/products/cargo-wide-leg-military-olive",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80",
    pricePaise: 349900,
    color: "Military Olive",
  },
  {
    id: "look-3",
    title: "ESSENTIALS HOODIE — WASHED NAVY",
    category: "HOODIE",
    href: "/products/essentials-hoodie-washed-navy",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80",
    pricePaise: 319900,
    color: "Washed Navy",
  },
];

const fmt = (p: number) => `\u20b9${(p / 100).toLocaleString("en-IN")}`;

export function ShopTheLookSection() {
  return (
    <section
      aria-labelledby="stl-heading"
      style={{ backgroundColor: "#F5F1E8", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)", maxWidth: "1600px", margin: "0 auto", width: "100%" }}>
        {/* Heading */}
        <div style={{ marginBottom: "2.5rem" }}>
          <span
            style={{
              display: "block",
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C94227",
              marginBottom: "0.6rem",
            }}
          >
            Get The Look
          </span>
          <h2
            id="stl-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(2rem,4.5vw,3.75rem)",
              fontWeight: 600,
              color: "#172545",
              lineHeight: 1,
            }}
          >
            Shop The Look
          </h2>
        </div>

        {/* Split layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "3rem", alignItems: "start" }}
          className="stl-grid"
        >
          {/* Left — editorial model image */}
          <div
            style={{
              position: "relative",
              aspectRatio: "3/4",
              overflow: "hidden",
              backgroundColor: "#EAE6DB",
            }}
          >
            <Image
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85"
              alt="CULTRAVEN styled look — Shop The Look"
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              style={{ objectFit: "cover" }}
            />

            {/* "LOOK 01" label */}
            <div
              style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "1.5rem",
                backgroundColor: "#172545",
                color: "#F5F1E8",
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "6px 14px",
              }}
            >
              LOOK 01
            </div>
          </div>

          {/* Right — product list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#6B7280",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              ITEMS IN THIS LOOK
            </p>

            {LOOK_PRODUCTS.map((p, i) => (
              <LookProductRow key={p.id} product={p} index={i} isLast={i === LOOK_PRODUCTS.length - 1} />
            ))}

            <div style={{ marginTop: "2rem" }}>
              <button
                style={{
                  width: "100%",
                  padding: "1.1rem",
                  backgroundColor: "#172545",
                  color: "#F5F1E8",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C94227";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#172545";
                }}
              >
                SHOP COMPLETE LOOK
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stl-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Single product row ────────────────────────────────────────────────────────

function LookProductRow({
  product: p,
  isLast,
}: {
  product: LookProduct;
  index: number;
  isLast: boolean;
}) {
  const [added, setAdded] = useState(false);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr auto",
        gap: "1rem",
        alignItems: "center",
        padding: "1.25rem 0",
        borderBottom: isLast ? "none" : "1px solid #D9D3C4",
      }}
    >
      {/* Thumbnail */}
      <Link
        href={p.href}
        style={{
          position: "relative",
          display: "block",
          width: "80px",
          height: "100px",
          overflow: "hidden",
          backgroundColor: "#EAE6DB",
          flexShrink: 0,
        }}
      >
        <Image
          src={p.image}
          alt={p.title}
          fill
          sizes="80px"
          style={{ objectFit: "cover" }}
        />
      </Link>

      {/* Info */}
      <div>
        <span
          style={{
            display: "block",
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "4px",
          }}
        >
          {p.category}
        </span>
        <Link
          href={p.href}
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#172545",
            display: "block",
            marginBottom: "4px",
            lineHeight: 1.3,
          }}
        >
          {p.title}
        </Link>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.7rem",
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          {p.color} · {fmt(p.pricePaise)}
        </span>
      </div>

      {/* Add button */}
      <button
        onClick={() => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1800);
        }}
        aria-label={`Add ${p.title} to bag`}
        style={{
          padding: "0.65rem 1rem",
          backgroundColor: added ? "#C94227" : "transparent",
          color: added ? "#F5F1E8" : "#172545",
          border: "2px solid",
          borderColor: added ? "#C94227" : "#172545",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: "0.62rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        {added ? "\u2713" : "+ BAG"}
      </button>
    </div>
  );
}
