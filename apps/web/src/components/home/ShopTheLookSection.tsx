/**
 * ShopTheLookSection — editorial model image + shoppable product sidebar.
 *
 * Layout: large model image (left) + stacked product cards (right).
 * "SHOP COMPLETE LOOK" adds all items to cart in one click → opens cart or
 * navigates to /cart.
 */
"use client";

import React, { useState } from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface LookProduct {
  id: string;
  title: string;
  category: string;
  href: string;
  image: string;
  pricePaise: number;
  color: string;
}

export interface ShopLookData {
  lookLabel: string;
  modelImage: string;
  products: LookProduct[];
}

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

/** The look is loaded from the database (ShopLook). No record → section not rendered. */
export function ShopTheLookSection({ look }: { look: ShopLookData | null }) {
  const [allAdded, setAllAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const addItems = useCartStore((s) => s.addItems);
  if (!look || look.products.length === 0) return null;

  const totalLookPrice = look.products.reduce((sum, p) => sum + p.pricePaise, 0);

  const handleBuyLook = () => {
    addItems(
      look.products.map((p) => ({
        productId: p.id,
        slug: p.href.replace(/^\/products\//, ""),
        title: p.title,
        image: p.image,
        sku: `${p.id}-default`,
        size: "Free Size",
        color: p.color,
        pricePaise: p.pricePaise,
      }))
    );
    setAllAdded(true);
    setTimeout(() => setAllAdded(false), 2500);
  };

  return (
    <section
      className="cv-auto"
      aria-labelledby="stl-heading"
      style={{ backgroundColor: "var(--color-cream)", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Heading */}
        <div style={{ marginBottom: "2.5rem" }}>
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
            Get The Look
          </span>
          <h2
            id="stl-heading"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem,4.5vw,3.75rem)",
              fontWeight: 600,
              color: "var(--color-navy)",
              lineHeight: 1,
            }}
          >
            Shop The Look
          </h2>
        </div>

        {/* Split layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "3rem", alignItems: "stretch" }}
          className="stl-grid"
        >
          {/* Left — editorial model image */}
          <div
            style={{
              position: "relative",
              aspectRatio: "3/4",
              overflow: "hidden",
              backgroundColor: "var(--color-mist)",
            }}
          >
            {look.modelImage ? (
              <Image
                src={look.modelImage}
                alt="CULTRAVEN styled look — Shop The Look"
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                style={{ objectFit: "cover" }}
              />
            ) : null}
            {/* Hotspots */}
            {look.products[0] && (
              <Link
                href={look.products[0].href}
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "55%",
                  width: "24px",
                  height: "24px",
                  backgroundColor: "var(--color-crimson)",
                  borderRadius: "50%",
                  border: "2px solid var(--color-cream)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  zIndex: 10,
                  animation: "pulse 2s infinite",
                }}
              >
                <span style={{ color: "var(--color-cream)", fontWeight: 900, fontSize: "16px", lineHeight: 1 }}>+</span>
              </Link>
            )}
            {look.products[1] && (
              <Link
                href={look.products[1].href}
                style={{
                  position: "absolute",
                  top: "75%",
                  left: "45%",
                  width: "24px",
                  height: "24px",
                  backgroundColor: "var(--color-crimson)",
                  borderRadius: "50%",
                  border: "2px solid var(--color-cream)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  zIndex: 10,
                  animation: "pulse 2s infinite",
                }}
              >
                <span style={{ color: "var(--color-cream)", fontWeight: 900, fontSize: "16px", lineHeight: 1 }}>+</span>
              </Link>
            )}
            {/* Look label */}
            <div
              style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "1.5rem",
                backgroundColor: "var(--color-navy)",
                color: "var(--color-cream)",
                fontFamily: "var(--font-sans)",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "6px 14px",
              }}
            >
              {look.lookLabel}
            </div>
          </div>

          {/* Right — product list + CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0", justifyContent: "space-between" }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--color-gray)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              {look.products.length} ITEMS IN THIS LOOK
            </p>

            {look.products.map((p, i) => (
              <LookProductRow
                key={p.id}
                product={p}
                index={i}
                isLast={i === look.products.length - 1}
              />
            ))}

            {/* Total + Buy Look CTA */}
            <div style={{ marginTop: "2rem" }}>
              {/* Total price row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 0",
                  borderTop: "2px solid var(--color-navy)",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-navy)",
                  }}
                >
                  COMPLETE LOOK TOTAL
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "var(--color-navy)",
                  }}
                >
                  {fmt(totalLookPrice)}
                </span>
              </div>

              {/* One-click Buy Look button */}
              <button
                type="button"
                onClick={handleBuyLook}
                className={`cv-btn cv-btn-block ${allAdded ? "cv-btn-lava" : "cv-btn-navy"}`}
                style={{ padding: "1.15rem 1.5rem" }}
              >
                {allAdded ? `✓ ${look.products.length} ITEMS ADDED TO BAG` : `BUY COMPLETE LOOK — ${fmt(totalLookPrice)}`}
              </button>

              {/* Checkout link shown after adding */}
              {allAdded && (
                <Link href="/checkout" className="cv-btn cv-btn-outline cv-btn-block" style={{ marginTop: "0.9rem" }}>
                  PROCEED TO CHECKOUT
                  <svg className="cv-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

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
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      productId: p.id,
      slug: p.href.replace(/^\/products\//, ""),
      title: p.title,
      image: p.image,
      sku: `${p.id}-default`,
      size: "Free Size",
      color: p.color,
      pricePaise: p.pricePaise,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

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
      <Link
        href={p.href}
        style={{
          position: "relative",
          display: "block",
          width: "80px",
          height: "100px",
          overflow: "hidden",
          backgroundColor: "var(--color-mist)",
          flexShrink: 0,
        }}
      >
        <Image src={p.image} alt={p.title} fill sizes="80px" style={{ objectFit: "cover" }} />
      </Link>

      {/* Info */}
      <div>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--color-crimson)",
            marginBottom: "4px",
          }}
        >
          {p.category}
        </span>
        <Link
          href={p.href}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--color-navy)",
            display: "block",
            marginBottom: "4px",
            lineHeight: 1.3,
          }}
        >
          {p.title}
        </Link>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.7rem",
            fontWeight: 500,
            color: "var(--color-gray)",
          }}
        >
          {p.color} · {fmt(p.pricePaise)}
        </span>
      </div>

      {/* Add to bag button — wired to cart store */}
      <button
        onClick={handleAdd}
        aria-label={`Add ${p.title} to bag`}
        style={{
          padding: "0.65rem 0.9rem",
          backgroundColor: added ? "var(--color-lava)" : "transparent",
          color: added ? "var(--color-navy)" : "var(--color-navy)",
          border: "2px solid",
          borderColor: added ? "var(--color-lava)" : "var(--color-navy)",
          boxShadow: added ? "2px 2px 0px 0px var(--color-navy)" : "none",
          fontFamily: "var(--font-sans)",
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
        {added ? "✓ ADDED" : "+ BAG"}
      </button>
    </div>
  );
}
