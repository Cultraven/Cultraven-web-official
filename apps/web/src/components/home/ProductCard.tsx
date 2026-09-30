"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPriceINR, lowestMrp, lowestPrice } from "@shop/types";
import type { Product } from "@shop/types";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
  cardWidth?: number | string;
}

export function ProductCard({ product, cardWidth = "100%" }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const img1 = product.images[0] ?? "";
  const img2 = product.images[1] ?? img1;
  const price = lowestPrice(product.variants);
  const mrp = lowestMrp(product.variants);
  const isOnSale = mrp !== undefined && mrp > price;
  
  const discountPercent = isOnSale ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const badgeText = product.isNewArrival ? "NEW" : (isOnSale ? `-${discountPercent}%` : "");
  
  const mockRating = "4.8";
  const mockReviews = "124";

  return (
    <article
      style={{
        width: typeof cardWidth === "number" ? `${cardWidth}px` : cardWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-cream)",
        border: "var(--border-thick)",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        position: "relative",
      }}
      className="product-card"
    >
      {/* Wishlist Heart */}
      <button 
        aria-label="Add to wishlist"
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 20,
          background: "var(--color-cream)",
          border: "2px solid var(--color-navy)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "2px 2px 0px 0px var(--color-navy)",
          transition: "transform 0.1s ease",
        }}
        className="wishlist-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      {/* Image block */}
      <Link
        href={`/product/${product.slug}`}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "4/5",
          maxHeight: "360px",
          overflow: "hidden",
          backgroundColor: "var(--color-mist)",
          borderBottom: "var(--border-thick)",
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
          sizes="(max-width: 768px) 50vw, 300px"
          style={{ objectFit: "cover", opacity: hovered && img2 !== img1 ? 0 : 1, transition: "opacity 0.4s ease" }}
        />
        {img2 !== img1 && (
          <Image
            src={img2}
            alt={`${product.title} alt`}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            style={{ objectFit: "cover", position: "absolute", inset: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.4s ease, transform 0.4s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
          />
        )}

        {/* ONE Badge Max */}
        {badgeText && (
          <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10 }}>
            <span style={{ 
              backgroundColor: "var(--color-crimson)", 
              color: "var(--color-cream)", 
              fontFamily: "var(--font-mono)", 
              fontWeight: 700, 
              fontSize: "10px", 
              letterSpacing: "0.1em", 
              textTransform: "uppercase", 
              padding: "4px 8px",
              border: "2px solid var(--color-navy)",
              boxShadow: "2px 2px 0px 0px var(--color-navy)",
              display: "inline-block",
              transform: "rotate(-3deg)"
            }}>
              {badgeText}
            </span>
          </div>
        )}

        {/* Quick Add Overlay */}
        <div 
          className="quick-add-overlay"
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            padding: "12px",
            background: "linear-gradient(to top, rgba(23,37,69,0.8) 0%, transparent 100%)",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s ease",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              const price = lowestPrice(product.variants);
              const mrp = lowestMrp(product.variants);
              addItem({
                productId: product.id,
                slug: product.slug,
                title: product.title,
                image: product.images[0] ?? "",
                sku: product.variants[0]?.sku ?? `${product.id}-free`,
                size: product.variants[0]?.size ?? "Free Size",
                color: product.variants[0]?.color ?? "Default",
                pricePaise: price,
                mrpPaise: mrp,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
            style={{
              width: "100%",
              backgroundColor: added ? "var(--color-lava)" : "var(--color-cream)",
              color: "var(--color-navy)",
              border: "2px solid var(--color-navy)",
              boxShadow: "2px 2px 0px 0px var(--color-navy)",
              padding: "8px",
              fontFamily: "var(--font-sans)",
              fontWeight: 900,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {added ? "ADDED ✓" : "QUICK ADD"}
          </button>
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <h3 style={{ margin: 0 }}>
            <Link
              href={`/product/${product.slug}`}
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "1",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: "var(--color-navy)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textDecoration: "none"
              }}
            >
              {product.title}
            </Link>
          </h3>
          
          {/* Rating Chip */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "4px", 
            backgroundColor: "var(--color-navy)", 
            color: "var(--color-cream)", 
            padding: "2px 6px", 
            border: "1.5px solid var(--color-navy)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            flexShrink: 0
          }}>
            <span style={{ color: "var(--color-yellow)", fontSize: "10px" }}>★</span>
            <span>{mockRating} <span style={{ color: "rgba(245,241,232,0.7)" }}>({mockReviews})</span></span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "var(--color-navy)" }}>
            {formatPriceINR(price)}
          </span>
          {isOnSale && mrp && (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "11px", color: "var(--color-gray)", textDecoration: "line-through" }}>
              {formatPriceINR(mrp)}
            </span>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "4px" }}>
          {/* Color Swatches */}
          <div style={{ display: "flex", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#1C1C1C", border: "1px solid var(--color-navy)" }} />
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--color-cream)", border: "1px solid var(--color-navy)" }} />
          </div>

          {/* Size Chips */}
          <div style={{ display: "flex", gap: "4px" }}>
            {["S", "M", "L", "XL"].map((sz) => (
              <span key={sz} style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--color-navy)",
                fontFamily: "var(--font-mono)",
              }}>
                {sz}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        .product-card:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-md) !important; }
        .wishlist-btn:hover { transform: scale(1.1); background-color: var(--color-navy) !important; }
        .wishlist-btn:hover svg { stroke: var(--color-cream) !important; }
        @media (max-width: 1024px) {
          .quick-add-overlay { display: none !important; }
        }
      `}</style>
    </article>
  );
}

export function ProductCardSkeleton({ cardWidth = "100%" }: { cardWidth?: number | string }) {
  return (
    <div style={{ width: typeof cardWidth === "number" ? `${cardWidth}px` : cardWidth, flexShrink: 0, border: "var(--border-thick)", backgroundColor: "var(--color-cream)" }}>
      <div style={{ aspectRatio: "3/4", backgroundColor: "var(--color-mist)", borderBottom: "var(--border-thick)", animation: "pulse 1.5s infinite" }} />
      <div style={{ padding: "12px" }}>
        <div style={{ height: "14px", backgroundColor: "var(--color-mist)", width: "75%", marginBottom: "8px" }} />
        <div style={{ height: "12px", backgroundColor: "var(--color-mist)", width: "35%" }} />
      </div>
    </div>
  );
}
