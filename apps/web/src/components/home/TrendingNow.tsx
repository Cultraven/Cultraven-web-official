"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { TRENDING_NOW_ITEMS, type TrendingItem } from "@/lib/fixtures";

export function TrendingNow({ items = TRENDING_NOW_ITEMS }: { items?: TrendingItem[] }) {
  return (
    <section
      style={{
        backgroundColor: "#F5F1E8",
        padding: "clamp(4rem,8vw,8rem) 0",
      }}
    >
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Section heading */}
        <h2
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontStyle: "italic",
            fontSize: "clamp(2rem,4.5vw,3.75rem)",
            fontWeight: 600,
            color: "#172545",
            marginBottom: "2.5rem",
            lineHeight: 1,
          }}
        >
          Trending Now
        </h2>

        {/* 3-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "1.5rem",
          }}
          className="trend-grid"
        >
          {items.map((item) => (
            <TrendCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .trend-grid { grid-template-columns: 1fr; } }
        @media (max-width: 1024px) and (min-width: 769px) { .trend-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>
    </section>
  );
}

function TrendCard({ item }: { item: TrendingItem }) {
  return (
    <div
      style={{ position: "relative", backgroundColor: "#EAE6DB" }}
      className="trend-card"
    >
      <Link
        href={item.href}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "3/4",
          overflow: "hidden",
        }}
      >
        <Image
          src={item.imageSrc}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: "cover", transition: "transform 0.65s ease" }}
          className="trend-img"
        />

        {/* Bottom bar CTA */}
        <div
          style={{
            position: "absolute",
            bottom: "1.25rem",
            left: "1.25rem",
            right: "1.25rem",
            padding: "0.85rem 1rem",
            backgroundColor: "#F5F1E8",
            border: "2px solid #172545",
            textAlign: "center",
            transition: "background-color 0.2s ease",
          }}
          className="trend-bar"
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#172545",
            }}
          >
            {item.title}
          </span>
        </div>
      </Link>

      <style>{`
        .trend-card:hover .trend-img { transform: scale(1.06); }
        .trend-card:hover .trend-bar { background-color: #172545; }
        .trend-card:hover .trend-bar span { color: #F5F1E8; }
      `}</style>
    </div>
  );
}
