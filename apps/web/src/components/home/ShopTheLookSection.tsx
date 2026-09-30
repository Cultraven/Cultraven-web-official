/**
 * ShopTheLookSection — editorial model image + shoppable product sidebar.
 *
 * Layout: large model image (left 55%) + stacked product cards (right 45%).
 * CMS-driven: fetches from /api/cms/shop-the-look with hardcoded fallback.
 */
"use client";

import React, { useState, useEffect } from "react";
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

interface ShopLookData {
  lookLabel: string;
  modelImage: string;
  products: LookProduct[];
}

const DEFAULT_LOOK: ShopLookData = {
  lookLabel: "LOOK 01",
  modelImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85",
  products: [
    { id: "look-1", title: "RAVEN OVERSIZED TEE — ACID BLACK", category: "T-SHIRT", href: "/products/raven-oversized-tee-acid-black", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80", pricePaise: 199900, color: "Acid Black" },
    { id: "look-2", title: "CARGO WIDE LEG — MILITARY OLIVE", category: "CARGO", href: "/products/cargo-wide-leg-military-olive", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&auto=format&fit=crop&q=80", pricePaise: 349900, color: "Military Olive" },
    { id: "look-3", title: "ESSENTIALS HOODIE — WASHED NAVY", category: "HOODIE", href: "/products/essentials-hoodie-washed-navy", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&auto=format&fit=crop&q=80", pricePaise: 319900, color: "Washed Navy" },
  ],
};

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export function ShopTheLookSection() {
  const [look, setLook] = useState<ShopLookData>(DEFAULT_LOOK);

  useEffect(() => {
    fetch("/api/cms/shop-the-look")
      .then((r) => r.json())
      .then((d) => { if (d.look?.products?.length > 0) setLook(d.look); })
      .catch(() => {});
  }, []);

  return (
    <section
      aria-labelledby="stl-heading"
      style={{ backgroundColor: "var(--color-cream)", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Heading */}
        <div style={{ marginBottom: "2.5rem" }}>
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.6rem" }}>
            Get The Look
          </span>
          <h2
            id="stl-heading"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4.5vw,3.75rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1 }}
          >
            Shop The Look
          </h2>
        </div>

        {/* Split layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "3rem", alignItems: "stretch" }} className="stl-grid">
          {/* Left — editorial model image */}
          <div style={{ position: "relative", aspectRatio: "3/4", maxHeight: "600px", overflow: "hidden", backgroundColor: "var(--color-mist)" }}>
            <Image
              src={look.modelImage || DEFAULT_LOOK.modelImage}
              alt="CULTRAVEN styled look — Shop The Look"
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              style={{ objectFit: "cover" }}
            />
            {/* Hotspots for first two products */}
            {look.products[0] && (
              <Link href={look.products[0].href} style={{ position: "absolute", top: "40%", left: "55%", width: "24px", height: "24px", backgroundColor: "var(--color-crimson)", borderRadius: "50%", border: "2px solid var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center", transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 10, animation: "pulse 2s infinite" }}>
                <span style={{ color: "var(--color-cream)", fontWeight: 900, fontSize: "16px", lineHeight: 1 }}>+</span>
              </Link>
            )}
            {look.products[1] && (
              <Link href={look.products[1].href} style={{ position: "absolute", top: "75%", left: "45%", width: "24px", height: "24px", backgroundColor: "var(--color-crimson)", borderRadius: "50%", border: "2px solid var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center", transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 10, animation: "pulse 2s infinite" }}>
                <span style={{ color: "var(--color-cream)", fontWeight: 900, fontSize: "16px", lineHeight: 1 }}>+</span>
              </Link>
            )}
            {/* Look label */}
            <div style={{ position: "absolute", bottom: "1.5rem", left: "1.5rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", padding: "6px 14px" }}>
              {look.lookLabel}
            </div>
          </div>

          {/* Right — product list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-gray)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
              ITEMS IN THIS LOOK
            </p>
            {look.products.map((p, i) => (
              <LookProductRow key={p.id} product={p} index={i} isLast={i === look.products.length - 1} />
            ))}
            <div style={{ marginTop: "2rem" }}>
              <Link
                href="/collections/all"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "1.1rem",
                  backgroundColor: "var(--color-navy)",
                  color: "var(--color-cream)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "background-color 0.2s ease",
                }}
              >
                SHOP COMPLETE LOOK
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .stl-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .stl-grid > div:first-child { max-height: 400px !important; aspect-ratio: 16/9 !important; }
        }
        @media (max-width: 600px) {
          .stl-grid > div:first-child { max-height: 280px !important; }
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
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
      }}
    >
      {/* Thumbnail */}
      <Link href={p.href} style={{ position: "relative", display: "block", width: "80px", height: "100px", overflow: "hidden", backgroundColor: "var(--color-mist)", flexShrink: 0 }}>
        <Image src={p.image} alt={p.title} fill sizes="80px" style={{ objectFit: "cover" }} />
      </Link>

      {/* Info */}
      <div>
        <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "4px" }}>
          {p.category}
        </span>
        <Link href={p.href} style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-navy)", display: "block", marginBottom: "4px", lineHeight: 1.3 }}>
          {p.title}
        </Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 500, color: "var(--color-gray)" }}>
          {p.color} · {fmt(p.pricePaise)}
        </span>
      </div>

      {/* Add button */}
      <button
        onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 1800); }}
        aria-label={`Add ${p.title} to bag`}
        style={{ padding: "0.65rem 1rem", backgroundColor: added ? "var(--color-crimson)" : "transparent", color: added ? "var(--color-cream)" : "var(--color-navy)", border: "2px solid", borderColor: added ? "var(--color-crimson)" : "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease", flexShrink: 0 }}
      >
        {added ? "✓" : "+ BAG"}
      </button>
    </div>
  );
}
