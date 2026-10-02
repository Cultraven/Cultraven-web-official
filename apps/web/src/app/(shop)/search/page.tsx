"use client";
/**
 * Search Page — /search
 * Full predictive search with trending queries, category/product results.
 */
import React, { useState, useEffect, useDeferredValue, useMemo, useRef } from "react";
import Image from "@/components/common/CmsImage";
import Link from "next/link";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const TRENDING = ["Oversized T-Shirts", "Cargos", "Hoodies", "New Drop", "Black", "Streetwear"];

interface SearchProduct { id: string; title: string; pricePaise: number; category: string; image: string; href: string }

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // /search?q=… pre-fills the query; focus the field only where there is no on-screen keyboard to cover the results.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q.slice(0, 80));
    if (window.matchMedia("(hover: hover)").matches) inputRef.current?.focus();
  }, []);

  // The catalog comes from the database (/api/products). Nothing is hardcoded.
  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts((d.products ?? []).map((p: any) => ({ id: p.id, title: p.title, pricePaise: p.pricePaise, category: p.category, image: p.image, href: p.href }))))
      .catch(() => setProducts([]));
  }, []);

  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, deferredQuery]);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Search input hero */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)", marginBottom: "1rem" }}>What are you looking for?</p>
        <div style={{ position: "relative", maxWidth: "640px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,232,0.5)" strokeWidth="2" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            type="search"
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories..."
            style={{ width: "100%", padding: "1.1rem 1rem 1.1rem 3rem", border: "none", borderBottom: "2px solid rgba(245,241,232,0.3)", backgroundColor: "transparent", fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem,4vw,2.5rem)", color: "var(--color-cream)", outline: "none" }}
          />
        </div>
      </div>

      <div style={{ padding: "clamp(2rem,4vw,4rem) clamp(1.25rem,4vw,5rem)" }}>
        {query.trim().length === 0 ? (
          <>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "1.25rem" }}>TRENDING SEARCHES</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "3rem" }}>
              {TRENDING.map((t) => (
                <button key={t} onClick={() => setQuery(t)} style={{ padding: "0.5rem 1.25rem", border: "2px solid var(--color-navy)", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)", backgroundColor: "transparent", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.78rem", color: "var(--color-navy)", cursor: "pointer", transition: "all 0.2s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-navy)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)"; }}>{t}</button>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "1.5rem" }}>BROWSE CATEGORIES</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }} className="search-cats">
              {["T-Shirts", "Hoodies", "Cargos", "Shirts", "Sweatshirts", "Jeans", "Trousers", "Outerwear"].map((cat) => (
                <Link key={cat} href={`/shop/${cat.toLowerCase()}`} style={{ display: "block", padding: "1rem", backgroundColor: "var(--color-mist)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", textAlign: "center", textDecoration: "none", transition: "all 0.2s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-navy)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-cream)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-mist)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-navy)"; }}>{cat}</Link>
              ))}
            </div>
          </>
        ) : results.length === 0 ? (
          <div style={{ paddingTop: "2rem" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--color-navy)", marginBottom: "0.75rem" }}>No results for "{query}"</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)", marginBottom: "2rem" }}>Try different keywords, or browse our collections.</p>
            <Link href="/collections/all" style={{ display: "inline-flex", padding: "0.9rem 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>SHOP ALL</Link>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", color: "var(--color-gray)", marginBottom: "2rem" }}>{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="search-results">
              {results.map((p) => (
                <Link key={p.id} href={p.href} style={{ display: "block", textDecoration: "none" }}>
                  <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-mist)", marginBottom: "0.75rem" }}>
                    <Image src={p.image} alt={p.title} fill sizes="25vw" style={{ objectFit: "cover" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "3px" }}>{p.category}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "4px", lineHeight: 1.35 }}>{p.title}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)" }}>{fmt(p.pricePaise)}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
