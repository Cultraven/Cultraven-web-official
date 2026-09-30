"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Category {
  id: string;
  title: string;
  priceChip: string;
  href: string;
  image: string;
  spanClass: string;
}

const CATEGORIES: Category[] = [
  {
    id: "t-shirts",
    title: "T-SHIRTS",
    priceChip: "UNDER ₹1,499",
    href: "/collections/t-shirts",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    spanClass: "col-span-2 row-span-2",
  },
  {
    id: "shirts",
    title: "SHIRTS",
    priceChip: "UNDER ₹1,999",
    href: "/collections/shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e32f6b47c?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-1",
  },
  {
    id: "hoodies",
    title: "HOODIES",
    priceChip: "UNDER ₹2,999",
    href: "/collections/hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-2",
  },
  {
    id: "sweatshirts",
    title: "SWEATSHIRTS",
    priceChip: "UNDER ₹2,499",
    href: "/collections/sweatshirts",
    image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-1",
  },
  {
    id: "cargos",
    title: "CARGOS",
    priceChip: "UNDER ₹2,999",
    href: "/collections/cargos",
    image: "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-1",
  },
  {
    id: "jeans",
    title: "JEANS",
    priceChip: "UNDER ₹2,999",
    href: "/collections/jeans",
    image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-1",
  },
  {
    id: "trousers",
    title: "TROUSERS",
    priceChip: "UNDER ₹2,499",
    href: "/collections/trousers",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-1",
  },
  {
    id: "outerwear",
    title: "OUTERWEAR",
    priceChip: "UNDER ₹3,999",
    href: "/collections/outerwear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    spanClass: "col-span-1 row-span-1",
  },
];


export function CategoryTiles() {
  return (
    <section
      aria-labelledby="cat-heading"
      style={{ backgroundColor: "var(--color-cream)", padding: "clamp(3rem,6vw,6rem) 0", borderBottom: "var(--border-thick)" }}
    >
      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)" }}>
        {/* Header */}
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
          <h2
            id="cat-heading"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(3rem,8vw,6.5rem)",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              color: "var(--color-navy)",
              lineHeight: 0.9,
              textShadow: "3px 3px 0px rgba(23,37,69,0.2)",
            }}
          >
            THE SHOP
          </h2>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridAutoRows: "250px",
            gap: "1.5rem",
          }}
          className="bento-grid"
        >
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { 
          .bento-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
            grid-auto-rows: 200px !important;
          }
          .bento-item-col-span-2 { grid-column: span 2 !important; }
          .bento-item-row-span-2 { grid-row: span 2 !important; }
        }
        @media (max-width: 600px) {
          .bento-grid {
            grid-template-columns: 1fr !important;
            grid-auto-rows: 280px !important;
          }
          .bento-item-col-span-2, .bento-item-row-span-2 {
            grid-column: span 1 !important;
            grid-row: span 1 !important;
          }
        }
      `}</style>
    </section>
  );
}

function CategoryCard({ cat }: { cat: Category }) {
  // Parse classes for inline grid behavior
  const isColSpan2 = cat.spanClass.includes("col-span-2");
  const isRowSpan2 = cat.spanClass.includes("row-span-2");

  return (
    <Link
      href={cat.href}
      style={{
        position: "relative",
        display: "block",
        overflow: "hidden",
        backgroundColor: "var(--color-navy)",
        border: "var(--border-thick)",
        boxShadow: "var(--shadow-md)",
        gridColumn: isColSpan2 ? "span 2" : "span 1",
        gridRow: isRowSpan2 ? "span 2" : "span 1",
      }}
      className={`cat-card ${isColSpan2 ? "bento-item-col-span-2" : ""} ${isRowSpan2 ? "bento-item-row-span-2" : ""}`}
    >
      <Image
        src={cat.image}
        alt={cat.title}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
        className="cat-img"
      />

      {/* Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(23,37,69,0.9) 0%, rgba(23,37,69,0.1) 60%, transparent 100%)",
        }}
      />

      {/* Price Chip Badge (Sticker Style) */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          backgroundColor: "var(--color-crimson)",
          color: "var(--color-cream)",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "12px",
          padding: "6px 12px",
          border: "2px solid var(--color-navy)",
          boxShadow: "2px 2px 0px 0px var(--color-navy)",
          transform: "rotate(3deg)",
          zIndex: 10,
        }}
      >
        {cat.priceChip}
      </div>

      {/* Text */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 400,
            fontSize: isRowSpan2 || isColSpan2 ? "clamp(1.5rem, 3vw, 2.5rem)" : "1.25rem",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "var(--color-cream)",
            lineHeight: 1.1,
            textShadow: "2px 2px 0px var(--color-navy)",
          }}
        >
          {cat.title}
        </p>
      </div>

      <style>{`
        .cat-card:hover .cat-img { transform: scale(1.05); }
        .cat-card:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-lg) !important; }
        .cat-card:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px 0px var(--color-navy) !important; }
      `}</style>
    </Link>
  );
}
