/**
 * CategoryTiles — Yurachi-style 5-col category shortcut grid.
 * Background: --color-mist (off-cream), cards are dark with white text.
 */
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Category {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
}

const CATEGORIES: Category[] = [
  {
    id: "essentials",
    title: "ESSENTIALS.260",
    subtitle: "HEAVYWEIGHT EVERYDAY BASICS",
    href: "/category/essentials",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "lava-stripe",
    title: "LAVA STRIPE",
    subtitle: "SPRAYED WASH STREETWEAR",
    href: "/category/lava-stripe",
    image:
      "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "acid-state",
    title: "ACID STATE",
    subtitle: "VINTAGE WASH STATEMENTS",
    href: "/category/acid-state",
    image:
      "https://images.unsplash.com/photo-1523398002811-999aa8e9f5b9?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "dharma",
    title: "DHARMA // EP01",
    subtitle: "MYTHOLOGY REIMAGINED",
    href: "/category/dharma",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "dragon-blood",
    title: "DRAGON BLOOD",
    subtitle: "ORIGINAL MYTHIC GRAPHICS",
    href: "/category/dragon-blood",
    image:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
  },
];

export function CategoryTiles() {
  return (
    <section
      aria-labelledby="cat-heading"
      style={{ backgroundColor: "var(--color-mist)", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
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
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              fontStyle: "italic",
              fontSize: "clamp(2rem,4.5vw,3.75rem)",
              fontWeight: 600,
              color: "var(--color-navy)",
              lineHeight: 1,
            }}
          >
            Shop by Category
          </h2>
          <Link
            href="/collections/all"
            style={{
              fontFamily: "var(--font-sans, Inter, sans-serif)",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
              borderBottom: "2px solid var(--color-navy)",
              paddingBottom: "2px",
              whiteSpace: "nowrap",
            }}
          >
            ALL COLLECTIONS
          </Link>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "1rem",
          }}
          className="cat-grid"
        >
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .cat-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px)  { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </section>
  );
}

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link
      href={cat.href}
      style={{
        position: "relative",
        display: "block",
        aspectRatio: "3/4",
        overflow: "hidden",
        backgroundColor: "var(--color-navy)",
        borderRadius: 0,
      }}
      className="cat-card"
    >
      <Image
        src={cat.image}
        alt={cat.title}
        fill
        sizes="(max-width: 640px) 50vw, 20vw"
        style={{ objectFit: "cover", transition: "transform 0.65s ease" }}
        className="cat-img"
      />

      {/* Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(23,37,69,0.88) 0%, rgba(23,37,69,0.25) 55%, transparent 100%)",
        }}
      />

      {/* Text */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "1.25rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            fontWeight: 900,
            fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "#F5F1E8",
            marginBottom: "4px",
            lineHeight: 1.2,
          }}
        >
          {cat.title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            fontWeight: 700,
            fontSize: "0.6rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(245,241,232,0.65)",
          }}
        >
          {cat.subtitle}
        </p>
      </div>

      <style>{`
        .cat-card:hover .cat-img { transform: scale(1.06); }
      `}</style>
    </Link>
  );
}
