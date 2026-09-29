"use client";
/**
 * Search Page — /search
 * Full predictive search with trending queries, category/product results.
 */
import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const TRENDING = ["Oversized T-Shirts", "Cargos", "Hoodies", "New Drop", "Black", "Streetwear"];

const ALL_PRODUCTS = [
  { id: "sp1", title: "RAVEN OVERSIZED TEE — ACID BLACK", pricePaise: 199900, category: "T-Shirts", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80", href: "/products/raven-oversized-tee-acid-black" },
  { id: "sp2", title: "DHARMA GRAPHIC HOODIE — STONE", pricePaise: 299900, category: "Hoodies", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80", href: "/products/dharma-graphic-hoodie-stone" },
  { id: "sp3", title: "CARGO WIDE LEG — MILITARY OLIVE", pricePaise: 349900, category: "Cargos", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80", href: "/products/cargo-wide-leg-military-olive" },
  { id: "sp4", title: "ACID STATE SWEATSHIRT", pricePaise: 249900, category: "Sweatshirts", image: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=200&auto=format&fit=crop&q=80", href: "/products/acid-state-sweatshirt-washed-grey" },
  { id: "sp5", title: "CLASSIC OVERSIZED TEE — WHITE", pricePaise: 189900, category: "T-Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&auto=format&fit=crop&q=80", href: "/products/classic-oversized-tee-white" },
  { id: "sp6", title: "CULTRAVEN RELAXED SHIRT — CREAM", pricePaise: 299900, category: "Shirts", image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200&auto=format&fit=crop&q=80", href: "/products/relaxed-shirt-cream" },
  { id: "sp7", title: "STREET CARGO — WASHED NAVY", pricePaise: 379900, category: "Cargos", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&auto=format&fit=crop&q=80", href: "/products/street-cargo-washed-navy" },
  { id: "sp8", title: "BOMBER JACKET — OLIVE BLACK", pricePaise: 599900, category: "Outerwear", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200&auto=format&fit=crop&q=80", href: "/products/bomber-jacket-olive-black" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = query.trim().length > 1
    ? ALL_PRODUCTS.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Search input hero */}
      <div style={{ backgroundColor: "#172545", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)", marginBottom: "1rem" }}>What are you looking for?</p>
        <div style={{ position: "relative", maxWidth: "640px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.5)" strokeWidth="2" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories..."
            style={{ width: "100%", padding: "1.1rem 1rem 1.1rem 3rem", border: "none", borderBottom: "2px solid rgba(245,241,232,0.3)", backgroundColor: "transparent", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.5rem,4vw,2.5rem)", color: "#F5F1E8", outline: "none" }}
          />
        </div>
      </div>

      <div style={{ padding: "clamp(2rem,4vw,4rem) clamp(1.25rem,4vw,5rem)" }}>
        {query.trim().length === 0 ? (
          <>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#172545", marginBottom: "1.25rem" }}>TRENDING SEARCHES</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "3rem" }}>
              {TRENDING.map((t) => (
                <button key={t} onClick={() => setQuery(t)} style={{ padding: "0.5rem 1.25rem", border: "1.5px solid #D9D3C4", backgroundColor: "transparent", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#172545", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#172545"; (e.currentTarget as HTMLButtonElement).style.color = "#F5F1E8"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#172545"; }}>{t}</button>
              ))}
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#172545", marginBottom: "1.5rem" }}>BROWSE CATEGORIES</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }} className="search-cats">
              {["T-Shirts", "Hoodies", "Cargos", "Shirts", "Sweatshirts", "Jeans", "Trousers", "Outerwear"].map((cat) => (
                <Link key={cat} href={`/shop/${cat.toLowerCase()}`} style={{ display: "block", padding: "1rem", backgroundColor: "#EAE6DB", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", textAlign: "center", textDecoration: "none", transition: "all 0.2s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#172545"; (e.currentTarget as HTMLAnchorElement).style.color = "#F5F1E8"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#EAE6DB"; (e.currentTarget as HTMLAnchorElement).style.color = "#172545"; }}>{cat}</Link>
              ))}
            </div>
          </>
        ) : results.length === 0 ? (
          <div style={{ paddingTop: "2rem" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.5rem", color: "#172545", marginBottom: "0.75rem" }}>No results for "{query}"</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280", marginBottom: "2rem" }}>Try different keywords, or browse our collections.</p>
            <Link href="/collections/all" style={{ display: "inline-flex", padding: "0.9rem 2rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>SHOP ALL</Link>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#6B7280", marginBottom: "2rem" }}>{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="search-results">
              {results.map((p) => (
                <Link key={p.id} href={p.href} style={{ display: "block", textDecoration: "none" }}>
                  <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB", marginBottom: "0.75rem" }}>
                    <Image src={p.image} alt={p.title} fill sizes="25vw" style={{ objectFit: "cover" }} />
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C94227", marginBottom: "3px" }}>{p.category}</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#172545", marginBottom: "4px", lineHeight: 1.35 }}>{p.title}</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{fmt(p.pricePaise)}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) { .search-cats { grid-template-columns: repeat(2,1fr) !important; } .search-results { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </div>
  );
}
