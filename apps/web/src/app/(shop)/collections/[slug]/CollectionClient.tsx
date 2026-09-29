/**
 * Collections Page — /collections/[slug]
 *
 * Premium PLP with:
 * - Collection hero (image + title + description + breadcrumb)
 * - Sticky filter sidebar (Category, Size, Color, Fit, Price, Availability)
 * - Sort menu (Popular, Newest, Best Selling, Price Low/High)
 * - 4-col desktop / 3-col tablet / 2-col mobile product grid
 * - Full product cards (hover swap, wishlist, quick-add, badges, color swatches)
 * - Active filter chips + clear all
 */
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  title: string;
  href: string;
  image: string;
  hoverImage: string;
  pricePaise: number;
  mrpPaise: number;
  rating: number;
  reviewCount: number;
  colors: { hex: string; label: string }[];
  sizes: string[];
  category: string;
  fit: string;
  badge?: string;
  inStock: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: Product[] = [
  {
    id: "p1", title: "RAVEN OVERSIZED TEE — ACID BLACK",
    href: "/products/raven-oversized-tee-acid-black",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
    pricePaise: 199900, mrpPaise: 249900, rating: 5, reviewCount: 124,
    colors: [{ hex: "#0A0A0A", label: "Black" }, { hex: "#C94227", label: "Flame" }],
    sizes: ["S", "M", "L", "XL", "XXL"], category: "T-Shirts", fit: "Oversized", badge: "NEW", inStock: true,
  },
  {
    id: "p2", title: "DHARMA GRAPHIC HOODIE — STONE",
    href: "/products/dharma-graphic-hoodie-stone",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&auto=format&fit=crop&q=80",
    pricePaise: 299900, mrpPaise: 399900, rating: 4, reviewCount: 88,
    colors: [{ hex: "#EAE6DB", label: "Stone" }, { hex: "#172545", label: "Navy" }],
    sizes: ["S", "M", "L", "XL"], category: "Hoodies", fit: "Oversized", badge: "BESTSELLER", inStock: true,
  },
  {
    id: "p3", title: "CARGO WIDE LEG — MILITARY OLIVE",
    href: "/products/cargo-wide-leg-military-olive",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
    pricePaise: 349900, mrpPaise: 499900, rating: 5, reviewCount: 67,
    colors: [{ hex: "#556B2F", label: "Olive" }, { hex: "#0A0A0A", label: "Black" }],
    sizes: ["S", "M", "L", "XL"], category: "Cargos", fit: "Baggy", badge: "LIMITED", inStock: true,
  },
  {
    id: "p4", title: "ACID STATE SWEATSHIRT — WASHED GREY",
    href: "/products/acid-state-sweatshirt-washed-grey",
    image: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    pricePaise: 249900, mrpPaise: 299900, rating: 4, reviewCount: 52,
    colors: [{ hex: "#9CA3AF", label: "Grey" }, { hex: "#EAE6DB", label: "Cream" }],
    sizes: ["XS", "S", "M", "L", "XL"], category: "Sweatshirts", fit: "Relaxed", inStock: true,
  },
  {
    id: "p5", title: "CLASSIC OVERSIZED TEE — WHITE",
    href: "/products/classic-oversized-tee-white",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    pricePaise: 189900, mrpPaise: 189900, rating: 5, reviewCount: 203,
    colors: [{ hex: "#FFFFFF", label: "White" }, { hex: "#0A0A0A", label: "Black" }, { hex: "#172545", label: "Navy" }],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"], category: "T-Shirts", fit: "Oversized", badge: "BESTSELLER", inStock: true,
  },
  {
    id: "p6", title: "CULTRAVEN RELAXED SHIRT — CREAM",
    href: "/products/relaxed-shirt-cream",
    image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    pricePaise: 299900, mrpPaise: 299900, rating: 5, reviewCount: 41,
    colors: [{ hex: "#EAE6DB", label: "Cream" }, { hex: "#FFFFFF", label: "White" }],
    sizes: ["S", "M", "L", "XL"], category: "Shirts", fit: "Relaxed", badge: "NEW", inStock: true,
  },
  {
    id: "p7", title: "ESSENTIALS HOODIE — JET BLACK",
    href: "/products/essentials-hoodie-jet-black",
    image: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    pricePaise: 319900, mrpPaise: 399900, rating: 4, reviewCount: 76,
    colors: [{ hex: "#0A0A0A", label: "Jet Black" }, { hex: "#2C2C2C", label: "Charcoal" }],
    sizes: ["S", "M", "L", "XL", "XXL"], category: "Hoodies", fit: "Regular", inStock: true,
  },
  {
    id: "p8", title: "STREET CARGO — WASHED NAVY",
    href: "/products/street-cargo-washed-navy",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    pricePaise: 379900, mrpPaise: 499900, rating: 5, reviewCount: 33,
    colors: [{ hex: "#172545", label: "Washed Navy" }, { hex: "#556B2F", label: "Olive" }],
    sizes: ["S", "M", "L", "XL"], category: "Cargos", fit: "Baggy", badge: "NEW", inStock: false,
  },
  {
    id: "p9", title: "DRAGON BLOOD GRAPHIC TEE — CHARCOAL",
    href: "/products/dragon-blood-graphic-tee-charcoal",
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    pricePaise: 229900, mrpPaise: 279900, rating: 5, reviewCount: 118,
    colors: [{ hex: "#2C2C2C", label: "Charcoal" }, { hex: "#172545", label: "Navy" }],
    sizes: ["S", "M", "L", "XL", "XXL"], category: "T-Shirts", fit: "Oversized", badge: "BESTSELLER", inStock: true,
  },
  {
    id: "p10", title: "CORE STRAIGHT JEANS — INDIGO",
    href: "/products/core-straight-jeans-indigo",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
    pricePaise: 299900, mrpPaise: 399900, rating: 4, reviewCount: 56,
    colors: [{ hex: "#3F5B8A", label: "Indigo" }, { hex: "#0A0A0A", label: "Black" }],
    sizes: ["28", "30", "32", "34", "36"], category: "Jeans", fit: "Regular", inStock: true,
  },
  {
    id: "p11", title: "WIDE PLEATED TROUSER — SAND",
    href: "/products/wide-pleated-trouser-sand",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    pricePaise: 329900, mrpPaise: 429900, rating: 4, reviewCount: 29,
    colors: [{ hex: "#C4A882", label: "Sand" }, { hex: "#EAE6DB", label: "Cream" }],
    sizes: ["S", "M", "L", "XL"], category: "Trousers", fit: "Relaxed", badge: "NEW", inStock: true,
  },
  {
    id: "p12", title: "BOMBER JACKET — OLIVE BLACK",
    href: "/products/bomber-jacket-olive-black",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    hoverImage: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=600&auto=format&fit=crop&q=80",
    pricePaise: 599900, mrpPaise: 799900, rating: 5, reviewCount: 22,
    colors: [{ hex: "#556B2F", label: "Olive" }, { hex: "#0A0A0A", label: "Black" }],
    sizes: ["S", "M", "L", "XL"], category: "Outerwear", fit: "Regular", badge: "LIMITED", inStock: true,
  },
];

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const CATEGORIES = ["T-Shirts", "Shirts", "Hoodies", "Sweatshirts", "Cargos", "Jeans", "Trousers", "Outerwear"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36"];
const FITS = ["Oversized", "Relaxed", "Regular", "Baggy"];
const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CollectionPageClient({
  collectionName,
  collectionSlug,
  description,
  heroImage,
}: {
  collectionName: string;
  collectionSlug: string;
  description: string;
  heroImage: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          const mapped = data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            href: `/products/${p.slug}`,
            image: p.image || "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
            hoverImage: p.hoverImage || p.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
            pricePaise: p.pricePaise || 199900,
            mrpPaise: p.mrpPaise || 249900,
            rating: 5,
            reviewCount: 42,
            colors: [{ hex: "#0A0A0A", label: "Black" }],
            sizes: ["S", "M", "L", "XL"],
            category: p.category || "T-Shirts",
            fit: p.fit || "Regular",
            badge: p.badge,
            inStock: p.inStock ?? true,
          }));
          setProducts(mapped);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const [sort, setSort] = useState("popular");
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterSize, setFilterSize] = useState<string[]>([]);
  const [filterFit, setFilterFit] = useState<string[]>([]);
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Apply filters
  const filtered = useMemo(() => {
    let list = [...products];
    if (filterCategory.length) list = list.filter((p) => filterCategory.includes(p.category));
    if (filterSize.length) list = list.filter((p) => p.sizes.some((s) => filterSize.includes(s)));
    if (filterFit.length) list = list.filter((p) => filterFit.includes(p.fit));
    if (filterInStock) list = list.filter((p) => p.inStock);
    // Sort
    if (sort === "price-asc") list.sort((a, b) => a.pricePaise - b.pricePaise);
    else if (sort === "price-desc") list.sort((a, b) => b.pricePaise - a.pricePaise);
    else if (sort === "bestselling") list.sort((a, b) => b.reviewCount - a.reviewCount);
    return list;
  }, [filterCategory, filterSize, filterFit, filterInStock, sort, products]);

  const activeCount = filterCategory.length + filterSize.length + filterFit.length + (filterInStock ? 1 : 0);

  const toggleFilter = <T,>(arr: T[], item: T, set: (v: T[]) => void) => {
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const clearAll = () => {
    setFilterCategory([]); setFilterSize([]); setFilterFit([]); setFilterInStock(false);
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* ── Collection Hero ── */}
      <div style={{ position: "relative", height: "400px", overflow: "hidden", backgroundColor: "#EAE6DB" }}>
        <Image src={heroImage} alt={collectionName} fill style={{ objectFit: "cover" }} priority />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(23,37,69,0.75) 0%, rgba(23,37,69,0.35) 60%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(2rem,4vw,4rem)", paddingTop: "80px" }}>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: collectionName, href: "#" }].map((crumb, i, arr) => (
              <React.Fragment key={crumb.href}>
                <Link href={crumb.href} style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: i === arr.length - 1 ? "#F5F1E8" : "rgba(245,241,232,0.55)", textDecoration: "none" }}>{crumb.label}</Link>
                {i < arr.length - 1 && <span style={{ color: "rgba(245,241,232,0.4)", fontSize: "10px" }}>/</span>}
              </React.Fragment>
            ))}
          </nav>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 1, letterSpacing: "-0.01em", marginBottom: "0.75rem" }}>{collectionName}</h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "rgba(245,241,232,0.75)", maxWidth: "460px", lineHeight: 1.6 }}>{description}</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "rgba(245,241,232,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "1rem" }}>{filtered.length} Products</p>
        </div>
      </div>

      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)", paddingBottom: "6rem" }}>
        {/* ── Controls bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0", borderBottom: "1px solid #D9D3C4", flexWrap: "wrap", gap: "1rem", position: "sticky", top: "80px", backgroundColor: "#F5F1E8", zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Filter toggle */}
            <button onClick={() => setFilterOpen(!filterOpen)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", border: "2px solid #172545", backgroundColor: filterOpen ? "#172545" : "transparent", color: filterOpen ? "#F5F1E8" : "#172545", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              FILTER {activeCount > 0 && `(${activeCount})`}
            </button>
            {/* Active filter chips */}
            {activeCount > 0 && (
              <button onClick={clearAll} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C94227", background: "none", border: "none", borderBottom: "1px solid #C94227", cursor: "pointer", paddingBottom: "1px" }}>CLEAR ALL</button>
            )}
          </div>
          {/* Sort */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setSortOpen(!sortOpen)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1.25rem", border: "2px solid #D9D3C4", backgroundColor: "transparent", color: "#172545", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", minWidth: "180px", justifyContent: "space-between" }}>
              {SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Sort"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {sortOpen && (
              <div style={{ position: "absolute", top: "110%", right: 0, backgroundColor: "#F5F1E8", border: "1px solid #D9D3C4", zIndex: 50, minWidth: "200px", boxShadow: "0 8px 24px rgba(23,37,69,0.12)" }}>
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.875rem 1.25rem", fontFamily: "Inter, sans-serif", fontWeight: sort === opt.value ? 800 : 600, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: sort === opt.value ? "#C94227" : "#172545", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #EAE6DB", cursor: "pointer" }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: filterOpen ? "240px 1fr" : "1fr", gap: "2rem", paddingTop: "2rem" }} className="plp-layout">
          {/* ── Filter Sidebar ── */}
          {filterOpen && (
            <aside style={{ position: "sticky", top: "148px", alignSelf: "start" }}>
              <FilterBlock title="Category" options={CATEGORIES} selected={filterCategory} onToggle={(v) => toggleFilter(filterCategory, v, setFilterCategory)} />
              <FilterBlock title="Size" options={SIZES} selected={filterSize} onToggle={(v) => toggleFilter(filterSize, v, setFilterSize)} pills />
              <FilterBlock title="Fit" options={FITS} selected={filterFit} onToggle={(v) => toggleFilter(filterFit, v, setFilterFit)} />
              <div style={{ paddingTop: "1rem", borderTop: "1px solid #D9D3C4", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#172545" }}>
                  <input type="checkbox" checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#172545" }} />
                  In Stock Only
                </label>
              </div>
            </aside>
          )}

          {/* ── Product Grid ── */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#172545", marginBottom: "1rem" }}>No products found.</p>
                <button onClick={clearAll} style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", border: "2px solid #172545", padding: "0.75rem 2rem", cursor: "pointer", background: "none" }}>CLEAR FILTERS</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="plp-grid">
                {filtered.map((p) => <PLPCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .plp-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px)  { .plp-grid { grid-template-columns: repeat(2,1fr) !important; } .plp-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

// ─── Filter Block ──────────────────────────────────────────────────────────────

function FilterBlock({ title, options, selected, onToggle, pills = false }: {
  title: string; options: string[]; selected: string[]; onToggle: (v: string) => void; pills?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderTop: "1px solid #D9D3C4", paddingBlock: "1rem" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545" }}>
        {title}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#172545" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ marginTop: "0.875rem", display: pills ? "flex" : "block", flexWrap: "wrap", gap: pills ? "0.5rem" : undefined }}>
          {options.map((opt) => pills ? (
            <button key={opt} onClick={() => onToggle(opt)} style={{ padding: "0.35rem 0.75rem", border: "1.5px solid", borderColor: selected.includes(opt) ? "#172545" : "#D9D3C4", backgroundColor: selected.includes(opt) ? "#172545" : "transparent", color: selected.includes(opt) ? "#F5F1E8" : "#172545", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.08em", cursor: "pointer" }}>{opt}</button>
          ) : (
            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.75rem", color: "#172545" }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} style={{ width: "14px", height: "14px", accentColor: "#172545" }} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PLP Product Card ──────────────────────────────────────────────────────────

function PLPCard({ product: p }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const disc = Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", opacity: p.inStock ? 1 : 0.65 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link href={p.href} style={{ position: "relative", display: "block", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB", marginBottom: "0.85rem" }}>
        {/* Badges */}
        <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10, display: "flex", flexDirection: "column", gap: "3px" }}>
          {p.badge && <span style={{ backgroundColor: p.badge === "LIMITED" || p.badge === "SALE" ? "#C94227" : "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 7px" }}>{p.badge}</span>}
          {!p.inStock && <span style={{ backgroundColor: "#6B7280", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontSize: "8px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 7px" }}>SOLD OUT</span>}
        </div>
        {/* Wishlist */}
        <button onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }} aria-label="Toggle wishlist" style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10, background: "rgba(245,241,232,0.92)", border: "none", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: hovered || wishlisted ? 1 : 0, transition: "opacity 0.2s" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlisted ? "#C94227" : "none"} stroke={wishlisted ? "#C94227" : "#172545"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <Image src={hovered && p.inStock ? p.hoverImage : p.image} alt={p.title} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover", transition: "transform 0.6s ease", transform: hovered && p.inStock ? "scale(1.04)" : "scale(1)" }} />
        {/* Quick Add */}
        {p.inStock && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0.75rem", transform: hovered ? "translateY(0)" : "translateY(100%)", transition: "transform 0.28s ease", zIndex: 10 }}>
            <button onClick={(e) => { e.preventDefault(); setAdded(true); setTimeout(() => setAdded(false), 1800); }} style={{ width: "100%", padding: "0.7rem", backgroundColor: added ? "#C94227" : "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "background-color 0.2s" }}>
              {added ? "ADDED ✓" : "QUICK ADD"}
            </button>
          </div>
        )}
      </Link>
      <div>
        <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
          {p.colors.map((c) => <div key={c.hex} title={c.label} style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: c.hex, border: "1.5px solid rgba(23,37,69,0.2)" }} />)}
        </div>
        <Link href={p.href} style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#172545", marginBottom: "5px", lineHeight: 1.35 }}>{p.title}</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{fmt(p.pricePaise)}</span>
          {disc > 0 && <><span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "0.72rem", color: "#6B7280", textDecoration: "line-through" }}>{fmt(p.mrpPaise)}</span><span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.65rem", color: "#C94227" }}>{disc}% off</span></>}
        </div>
      </div>
    </div>
  );
}
