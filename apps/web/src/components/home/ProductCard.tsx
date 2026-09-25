"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPriceINR, lowestMrp, lowestPrice } from "@shop/types";
import type { Product } from "@shop/types";

interface ProductCardProps {
  product: Product;
  cardWidth?: number;
}

export function ProductCard({ product, cardWidth = 300 }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  const img1 = product.images[0] ?? "";
  const img2 = product.images[1] ?? img1;
  const price = lowestPrice(product.variants);
  const mrp = lowestMrp(product.variants);
  const isOnSale = mrp !== undefined && mrp > price;

  return (
    <article
      style={{ width: `${cardWidth}px`, flexShrink: 0, display: "flex", flexDirection: "column" }}
    >
      {/* Image block */}
      <Link
        href={`/product/${product.slug}`}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "3/4",
          overflow: "hidden",
          backgroundColor: "#EAE6DB",
          marginBottom: "0.85rem",
        }}
        tabIndex={-1}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="pc-link"
      >
        <Image
          src={img1}
          alt={product.title}
          fill
          sizes={`${cardWidth}px`}
          style={{ objectFit: "cover", opacity: hovered && img2 !== img1 ? 0 : 1, transition: "opacity 0.3s ease" }}
        />
        {img2 !== img1 && (
          <Image
            src={img2}
            alt={`${product.title} alt`}
            fill
            sizes={`${cardWidth}px`}
            style={{ objectFit: "cover", position: "absolute", inset: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease" }}
          />
        )}

        {/* Badges */}
        <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 10 }}>
          {product.isNewArrival && (
            <span style={{ backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter,sans-serif", fontWeight: 900, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 8px" }}>
              NEW
            </span>
          )}
          {isOnSale && (
            <span style={{ backgroundColor: "#C94227", color: "#F5F1E8", fontFamily: "Inter,sans-serif", fontWeight: 900, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 8px" }}>
              SALE
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <h3 style={{ marginBottom: "6px" }}>
        <Link
          href={`/product/${product.slug}`}
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: "0.78rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#172545",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.title}
        </Link>
      </h3>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontFamily: "Inter,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>
          {formatPriceINR(price)}
        </span>
        {isOnSale && mrp && (
          <span style={{ fontFamily: "Inter,sans-serif", fontWeight: 500, fontSize: "0.78rem", color: "#6B7280", textDecoration: "line-through" }}>
            {formatPriceINR(mrp)}
          </span>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ cardWidth = 300 }: { cardWidth?: number }) {
  return (
    <div style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
      <div style={{ aspectRatio: "3/4", backgroundColor: "#EAE6DB", marginBottom: "0.85rem", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "14px", backgroundColor: "#EAE6DB", width: "75%", marginBottom: "8px" }} />
      <div style={{ height: "12px", backgroundColor: "#EAE6DB", width: "35%" }} />
    </div>
  );
}
