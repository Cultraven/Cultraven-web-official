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

import React, { useState, useMemo, Component } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Error Boundary ────────────────────────────────────────────────────────────
class PLPErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-navy)", textAlign: "center", padding: "0 2rem" }}>Something went wrong loading this collection.</p>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", padding: "0.875rem 2rem", textDecoration: "none" }}>BACK TO HOME</Link>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Safe array helpers ────────────────────────────────────────────────────────
const safeColors = (p: Partial<Product>) => Array.isArray(p.colors) ? p.colors.filter((c: any) => c && c.hex && c.label) : [];
const safeSizes  = (p: Partial<Product>) => Array.isArray(p.sizes)  ? p.sizes.filter(Boolean) : [];

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

function CollectionPageClientInner({
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
          const mapped = data.products
            .filter((p: any) => p.pricePaise != null)
            .map((p: any) => ({
            id: p.id,
            title: p.title,
            href: `/products/${p.slug}`,
            image: p.image || "",
            hoverImage: p.hoverImage || p.image || "",
            pricePaise: p.pricePaise,
            mrpPaise: p.mrpPaise || p.pricePaise,
            rating: Number(p.rating) || 0,
            reviewCount: Number(p.reviewCount) || 0,
            colors: safeColors(p),
            sizes: safeSizes(p),
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
    
    // Filter by collection slug
    if (collectionSlug === "new-in") {
      list = list.filter(p => p.badge === "NEW" || p.badge === "LIMITED");
    } else if (collectionSlug === "sale") {
      list = list.filter(p => p.mrpPaise > p.pricePaise);
    } else if (collectionSlug && collectionSlug !== "all") {
      list = list.filter(p => p.category.toLowerCase() === collectionSlug.toLowerCase());
    }

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
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* ── Collection Hero ── */}
      <div style={{ position: "relative", height: "400px", overflow: "hidden", backgroundColor: "var(--color-mist)" }}>
        {heroImage ? <Image src={heroImage} alt={collectionName} fill style={{ objectFit: "cover" }} priority /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(23,37,69,0.75) 0%, rgba(23,37,69,0.35) 60%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(2rem,4vw,4rem)", paddingTop: "80px" }}>
          {/* Back button */}
          <Link href="/collections" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,241,232,0.65)", textDecoration: "none", marginBottom: "0.75rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="15 18 9 12 15 6"/></svg>
            All Collections
          </Link>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: collectionName, href: "#" }].map((crumb, i, arr) => (
              <React.Fragment key={crumb.href}>
                <Link href={crumb.href} style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: i === arr.length - 1 ? "var(--color-cream)" : "rgba(245,241,232,0.55)", textDecoration: "none" }}>{crumb.label}</Link>
                {i < arr.length - 1 && <span style={{ color: "rgba(245,241,232,0.4)", fontSize: "10px" }}>/</span>}
              </React.Fragment>
            ))}
          </nav>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,8vw,6.5rem)", fontWeight: 400, color: "var(--color-cream)", lineHeight: 0.9, letterSpacing: "0.02em", marginBottom: "0.75rem", textTransform: "uppercase" }}>{collectionName}</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "rgba(245,241,232,0.75)", maxWidth: "460px", lineHeight: 1.6 }}>{description}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: "rgba(245,241,232,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "1rem" }}>{filtered.length} Products</p>
        </div>
      </div>

      <div style={{ paddingInline: "clamp(1.25rem,4vw,5rem)", paddingBottom: "6rem" }}>
        {/* ── Controls bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", borderBottom: "var(--border-thick)", borderTop: "var(--border-thick)", flexWrap: "wrap", gap: "1rem", position: "sticky", top: "72px", backgroundColor: "var(--color-cream)", zIndex: 40, marginTop: "2rem", boxShadow: "0 4px 0px rgba(23,37,69,1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Filter toggle */}
            <button onClick={() => setFilterOpen(!filterOpen)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", border: "2px solid var(--color-navy)", backgroundColor: filterOpen ? "var(--color-navy)" : "var(--color-cream)", color: filterOpen ? "var(--color-cream)" : "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "2px 2px 0px 0px var(--color-navy)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              FILTER {activeCount > 0 && `(${activeCount})`}
            </button>
            {/* Active filter chips */}
            {activeCount > 0 && (
              <button onClick={clearAll} style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-crimson)", background: "none", border: "none", cursor: "pointer", paddingBottom: "1px", textDecoration: "underline" }}>CLEAR ALL</button>
            )}
          </div>
          {/* Sort */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setSortOpen(!sortOpen)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1.25rem", border: "2px solid var(--color-navy)", backgroundColor: "var(--color-cream)", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", minWidth: "180px", justifyContent: "space-between", boxShadow: "2px 2px 0px 0px var(--color-navy)" }}>
              {SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Sort"}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {sortOpen && (
              <div style={{ position: "absolute", top: "110%", right: 0, backgroundColor: "var(--color-cream)", border: "2px solid var(--color-navy)", zIndex: 50, minWidth: "200px", boxShadow: "4px 4px 0px var(--color-navy)" }}>
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.875rem 1.25rem", fontFamily: "var(--font-sans)", fontWeight: sort === opt.value ? 900 : 700, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: sort === opt.value ? "var(--color-cream)" : "var(--color-navy)", backgroundColor: sort === opt.value ? "var(--color-navy)" : "transparent", border: "none", borderBottom: "2px solid var(--color-navy)", cursor: "pointer" }}>{opt.label}</button>
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
              <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border)", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-navy)" }}>
                  <input type="checkbox" checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "var(--color-navy)" }} />
                  In Stock Only
                </label>
              </div>
            </aside>
          )}

          {/* ── Product Grid ── */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 400, color: "var(--color-navy)", marginBottom: "1rem" }}>NO PRODUCTS FOUND.</p>
                <button onClick={clearAll} style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", border: "2px solid var(--color-navy)", padding: "1rem 2rem", cursor: "pointer", boxShadow: "4px 4px 0px var(--color-navy)" }}>CLEAR FILTERS</button>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="plp-grid">
                  {filtered.map((p) => <PLPCard key={p.id} product={p} />)}
                </div>
                {/* Load More */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem" }}>
                  <button className="btn-primary" style={{ padding: "16px 40px", fontSize: "14px" }}>
                    LOAD MORE
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function CollectionPageClient(props: any) {
  return (
    <PLPErrorBoundary>
      <CollectionPageClientInner {...props} />
    </PLPErrorBoundary>
  );
}

// ─── Filter Block ──────────────────────────────────────────────────────────────

function FilterBlock({ title, options, selected, onToggle, pills = false }: {
  title: string; options: string[]; selected: string[]; onToggle: (v: string) => void; pills?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderTop: "1px solid var(--color-border)", paddingBlock: "1rem" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)" }}>
        {title}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ marginTop: "0.875rem", display: pills ? "flex" : "block", flexWrap: "wrap", gap: pills ? "0.5rem" : undefined }}>
          {options.map((opt) => pills ? (
            <button key={opt} onClick={() => onToggle(opt)} style={{ padding: "0.35rem 0.75rem", border: "1.5px solid", borderColor: selected.includes(opt) ? "var(--color-navy)" : "var(--color-border)", backgroundColor: selected.includes(opt) ? "var(--color-navy)" : "transparent", color: selected.includes(opt) ? "var(--color-cream)" : "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.08em", cursor: "pointer" }}>{opt}</button>
          ) : (
            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.75rem", color: "var(--color-navy)" }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} style={{ width: "14px", height: "14px", accentColor: "var(--color-navy)" }} />
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
  
  const ratingText = p.rating ? String(p.rating) : "";

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-cream)",
        border: "var(--border-thick)",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        position: "relative",
        opacity: p.inStock ? 1 : 0.65
      }}
      className="product-card"
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wishlist Heart */}
      <button 
        aria-label="Toggle wishlist"
        onClick={(e) => { e.preventDefault(); setWishlisted((w) => !w); }}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 20,
          background: wishlisted ? "var(--color-crimson)" : "var(--color-cream)",
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "var(--color-crimson)" : "none"} stroke={wishlisted ? "var(--color-cream)" : "var(--color-navy)"} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      {/* Image block */}
      <Link
        href={p.href}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "3/4",
          overflow: "hidden",
          backgroundColor: "var(--color-mist)",
          borderBottom: "var(--border-thick)",
        }}
        tabIndex={-1}
        className="pc-link"
      >
        <Image
          src={p.image}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{ objectFit: "cover", opacity: hovered && p.inStock ? 0 : 1, transition: "opacity 0.4s ease" }}
        />
        {p.inStock && (
          <Image
            src={p.hoverImage}
            alt={`${p.title} alt`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            style={{ objectFit: "cover", position: "absolute", inset: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.4s ease, transform 0.4s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
          />
        )}

        {/* ONE Badge Max */}
        <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10 }}>
          {p.badge && p.inStock && (
            <span style={{ 
              backgroundColor: p.badge === "LIMITED" || p.badge === "SALE" ? "var(--color-crimson)" : "var(--color-navy)", 
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
              transform: "rotate(-3deg)",
              marginBottom: "4px"
            }}>
              {p.badge}
            </span>
          )}
          {!p.inStock && (
             <span style={{ 
              backgroundColor: "var(--color-gray)", 
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
              SOLD OUT
            </span>
          )}
        </div>

        {/* Quick Add Overlay */}
        {p.inStock && (
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
              onClick={(e) => { e.preventDefault(); setAdded(true); setTimeout(() => setAdded(false), 1800); }}
              style={{
                width: "100%",
                backgroundColor: added ? "var(--color-crimson)" : "var(--color-cream)",
                color: added ? "var(--color-cream)" : "var(--color-navy)",
                border: "2px solid var(--color-navy)",
                boxShadow: "2px 2px 0px 0px var(--color-navy)",
                padding: "8px",
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
                transition: "background-color 0.2s"
            }}>
              {added ? "ADDED ✓" : "JALDI ADD KAR"}
            </button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <h3 style={{ margin: 0 }}>
            <Link
              href={p.href}
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
              {p.title}
            </Link>
          </h3>
          
          {ratingText ? (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "2px", 
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
            <span>{ratingText}</span>
          </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "var(--color-navy)" }}>
            {fmt(p.pricePaise)}
          </span>
          {disc > 0 && (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "11px", color: "var(--color-gray)", textDecoration: "line-through" }}>
                {fmt(p.mrpPaise)}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "10px", color: "var(--color-crimson)" }}>
                {disc}% off
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "4px" }}>
          {/* Color Swatches */}
          <div style={{ display: "flex", gap: "4px" }}>
            {safeColors(p).map((c) => (
              <div key={c.hex} title={c.label} style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: c.hex, border: "1px solid var(--color-navy)" }} />
            ))}
          </div>

          {/* Size Chips */}
          <div style={{ display: "flex", gap: "4px" }}>
            {safeSizes(p).slice(0,4).map((sz) => (
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
      
    </article>
  );
}
