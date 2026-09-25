"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PIGMENTUM_COLLECTION, type PigmentumProduct } from "@/lib/fixtures";
import { useCartStore } from "@/store/cart";

const fmt = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;

export function PigmentumCollection({
  products = PIGMENTUM_COLLECTION,
}: {
  products?: PigmentumProduct[];
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleQuickAdd = (p: PigmentumProduct) => {
    addItem({
      productId: p.id,
      slug: p.id,
      sku: `${p.id}-40`,
      title: p.title,
      pricePaise: p.pricePaise,
      image: p.imageSrc,
      size: "40",
      color: p.swatchLabel,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <section style={{ backgroundColor: "#EAE6DB", padding: "clamp(4rem,8vw,8rem) 0" }}>
      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2.5rem",
            borderBottom: "2px solid #172545",
            paddingBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(2rem,4.5vw,3.75rem)",
              fontWeight: 600,
              color: "#172545",
              lineHeight: 1,
            }}
          >
            Archive Editions
          </h2>
          <Link
            href="/collections/pigmentum"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#172545",
              borderBottom: "2px solid #172545",
              paddingBottom: "2px",
            }}
          >
            VIEW ENTIRE PALETTE
          </Link>
        </div>

        {/* 4-col grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "1.5rem",
          }}
          className="pig-grid"
        >
          {products.map((p) => {
            const disc = Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100);
            return (
              <div key={p.id} style={{ display: "flex", flexDirection: "column" }}>
                {/* Image */}
                <Link
                  href={p.href}
                  style={{
                    position: "relative",
                    display: "block",
                    aspectRatio: "3/4",
                    overflow: "hidden",
                    backgroundColor: "#F5F1E8",
                    marginBottom: "0.85rem",
                  }}
                  className="pig-card"
                >
                  <Image
                    src={p.imageSrc}
                    alt={p.title}
                    fill
                    sizes="25vw"
                    style={{ objectFit: "cover", transition: "transform 0.6s ease" }}
                    className="pig-img"
                  />
                  {disc > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: "#C94227",
                        color: "#F5F1E8",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 900,
                        fontSize: "9px",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        padding: "4px 8px",
                        zIndex: 10,
                      }}
                    >
                      SALE
                    </span>
                  )}
                </Link>

                {/* Info */}
                <Link
                  href={p.href}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#172545",
                    marginBottom: "6px",
                    lineHeight: 1.3,
                  }}
                >
                  {p.title}
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>
                    {fmt(p.pricePaise)}
                  </span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "0.78rem", color: "#6B7280", textDecoration: "line-through" }}>
                    {fmt(p.mrpPaise)}
                  </span>
                </div>

                <button
                  onClick={() => handleQuickAdd(p)}
                  style={{
                    padding: "0.75rem 1rem",
                    border: "2px solid #172545",
                    backgroundColor: addedId === p.id ? "#172545" : "transparent",
                    color: addedId === p.id ? "#F5F1E8" : "#172545",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (addedId !== p.id) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#172545";
                      (e.currentTarget as HTMLButtonElement).style.color = "#F5F1E8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (addedId !== p.id) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "#172545";
                    }
                  }}
                >
                  {addedId === p.id ? "ADDED ✓" : "QUICK ADD"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .pig-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px)  { .pig-grid { grid-template-columns: 1fr !important; } }
        .pig-card:hover .pig-img { transform: scale(1.06); }
      `}</style>
    </section>
  );
}
