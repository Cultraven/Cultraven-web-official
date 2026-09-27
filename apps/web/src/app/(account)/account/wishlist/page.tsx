"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const INITIAL_WISHLIST = [
  { id: "w1", title: "RAVEN OVERSIZED TEE — ACID BLACK", pricePaise: 199900, mrpPaise: 249900, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&auto=format&fit=crop&q=80", href: "/products/raven-oversized-tee-acid-black", inStock: true },
  { id: "w2", title: "CARGO WIDE LEG — MILITARY OLIVE", pricePaise: 349900, mrpPaise: 499900, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80", href: "/products/cargo-wide-leg-military-olive", inStock: true },
  { id: "w3", title: "BOMBER JACKET — OLIVE BLACK", pricePaise: 599900, mrpPaise: 799900, image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format&fit=crop&q=80", href: "/products/bomber-jacket-olive-black", inStock: false },
  { id: "w4", title: "DRAGON BLOOD GRAPHIC TEE — CHARCOAL", pricePaise: 229900, mrpPaise: 279900, image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&auto=format&fit=crop&q=80", href: "/products/dragon-blood-graphic-tee-charcoal", inStock: true },
];

export default function WishlistPage() {
  const [items, setItems] = useState(INITIAL_WISHLIST);
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", padding: "clamp(2rem,5vw,5rem) clamp(1.25rem,4vw,5rem)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 600, color: "#172545" }}>Wishlist</h1>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#6B7280" }}>{items.length} item{items.length !== 1 ? "s" : ""}</p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D9D3C4" strokeWidth="1.5" style={{ margin: "0 auto 1.5rem" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.75rem", color: "#172545", marginBottom: "0.75rem" }}>Your wishlist is empty.</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280", marginBottom: "2rem" }}>Save your favourite pieces by clicking the heart icon on any product.</p>
          <Link href="/collections/all" style={{ display: "inline-flex", padding: "1rem 2.5rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>SHOP ALL</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem" }} className="wishlist-grid">
          {items.map((item) => (
            <div key={item.id} style={{ position: "relative" }}>
              <Link href={item.href} style={{ display: "block", position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB", marginBottom: "0.875rem" }}>
                <Image src={item.image} alt={item.title} fill sizes="25vw" style={{ objectFit: "cover", opacity: item.inStock ? 1 : 0.5 }} />
                {!item.inStock && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(245,241,232,0.4)" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#172545", backgroundColor: "#F5F1E8", padding: "5px 10px" }}>SOLD OUT</span>
                  </div>
                )}
                <button onClick={(e) => { e.preventDefault(); remove(item.id); }} style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(245,241,232,0.9)", border: "none", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Remove from wishlist">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#C94227" stroke="#C94227" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </Link>
              <Link href={item.href} style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#172545", marginBottom: "6px", lineHeight: 1.4 }}>{item.title}</Link>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#172545" }}>{fmt(item.pricePaise)}</span>
                {item.mrpPaise > item.pricePaise && <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280", textDecoration: "line-through" }}>{fmt(item.mrpPaise)}</span>}
              </div>
              {item.inStock ? (
                <Link href={item.href} style={{ display: "block", width: "100%", padding: "0.7rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", textDecoration: "none" }}>ADD TO BAG</Link>
              ) : (
                <button disabled style={{ width: "100%", padding: "0.7rem", backgroundColor: "#D9D3C4", color: "#6B7280", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: "not-allowed" }}>SOLD OUT</button>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) { .wishlist-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px) { .wishlist-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
