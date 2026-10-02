"use client";
/**
 * CategoryClient — Full product listing page for /category/[slug]
 *
 * Premium PLP with:
 * - Category hero header
 * - Sticky filter sidebar (Size, Color, Price, Availability)
 * - Sort menu
 * - Responsive product grid (4-col desktop, 2-col mobile)
 * - Product cards with hover, quick-add, badges
 * - Active filter chips + clear all
 * - Loads real products from /api/products filtered by category
 */
import React, { useState, useMemo, useEffect, Component } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface Product {
  id: string;
  title: string;
  slug: string;
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
  badge?: string;
  inStock: boolean;
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class PLPErrorBoundary extends Component<
  { children: React.ReactNode; slug: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; slug: string }) {
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

// ── Safe array helpers (root-cause fix for hex destructuring crash) ────────────
const safeColors = (p: Product) => Array.isArray(p.colors) ? p.colors.filter((c) => c && c.hex && c.label) : [];
const safeSizes  = (p: Product) => Array.isArray(p.sizes)  ? p.sizes.filter(Boolean) : [];

// ── Fixtures for offline/fallback ─────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="10" height="10" viewBox="0 0 24 24"
          fill={s <= rating ? "var(--color-yellow)" : "none"}
          stroke={s <= rating ? "var(--color-yellow)" : "var(--color-border)"}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

interface CategoryClientProps {
  slug: string;
  categoryName: string;
}

function CategoryClientInner({ slug, categoryName }: CategoryClientProps) {
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState(100000); // paise ÷ 100 = ₹
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Load products ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?category=${encodeURIComponent(categoryName)}&limit=24`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            // Normalize to ensure colors/sizes are always safe arrays
            const normalized: Product[] = data.products
              .filter((p: any) => p.pricePaise != null)
              .map((p: any) => ({
              id: String(p.id || p._id || Math.random()),
              title: p.title || "",
              slug: p.slug || "",
              href: p.href || `/products/${p.slug || ""}`,
              image: p.image || "",
              hoverImage: p.hoverImage || p.image || "",
              pricePaise: Number(p.pricePaise),
              mrpPaise: Number(p.mrpPaise || p.pricePaise),
              rating: Number(p.rating) || 0,
              reviewCount: Number(p.reviewCount) || 0,
              colors: Array.isArray(p.colors)
                ? p.colors
                    .filter((c: any) => c && typeof c.hex === "string" && typeof c.label === "string")
                    .map((c: any) => ({ hex: String(c.hex), label: String(c.label) }))
                : [],
              sizes: Array.isArray(p.sizes) ? p.sizes.filter(Boolean) : [],
              category: p.category || "",
              badge: p.badge,
              inStock: p.inStock !== false,
            }));
            setProducts(normalized);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("[category] failed to load products", e);
      }
      // No products (or a failed request) → empty state. Nothing is fabricated.
      setProducts([]);
      setLoading(false);
    };
    load();
  }, [slug, categoryName]);

  // ── All sizes / colors from loaded products ───────────────────────────────────
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const sizes = safeSizes(p);
      sizes.forEach((s) => { if (s) set.add(s); });
    });
    return Array.from(set);
  }, [products]);

  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      const colors = safeColors(p);
      colors.forEach((c) => {
        if (c && c.label && c.hex) map.set(c.label, c.hex);
      });
    });
    const result: { label: string; hex: string }[] = [];
    map.forEach((hex, label) => {
      result.push({ label, hex });
    });
    return result;
  }, [products]);

  // ── Filtered + sorted ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedSizes.length > 0) list = list.filter((p) => selectedSizes.some((s) => safeSizes(p).includes(s)));
    if (selectedColors.length > 0) list = list.filter((p) => selectedColors.some((c) => safeColors(p).some((col) => col.label === c)));
    if (inStockOnly) list = list.filter((p) => p.inStock);
    list = list.filter((p) => p.pricePaise <= priceMax * 100);
    if (sortBy === "price-asc") list.sort((a, b) => a.pricePaise - b.pricePaise);
    else if (sortBy === "price-desc") list.sort((a, b) => b.pricePaise - a.pricePaise);
    else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "newest") list.reverse();
    return list;
  }, [products, selectedSizes, selectedColors, inStockOnly, priceMax, sortBy]);

  const activeFiltersCount =
    selectedSizes.length + selectedColors.length + (inStockOnly ? 1 : 0) + (priceMax < 100000 ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedSizes([]); setSelectedColors([]); setPriceMax(100000); setInStockOnly(false);
  };

  const handleQuickAdd = (p: Product) => {
    const pSizes = safeSizes(p);
    const pColors = safeColors(p);
    addItem({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      image: p.image,
      sku: `${p.id}-${pSizes[0] || "M"}-default`,
      size: pSizes[0] || "M",
      color: pColors[0]?.label || "",
      pricePaise: p.pricePaise,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const toggleColor = (c: string) =>
    setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)", paddingTop: "calc(clamp(3rem,6vw,6rem) + 80px)" }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem" }}>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "rgba(245,241,232,0.5)", textDecoration: "none", letterSpacing: "0.1em" }}>HOME</Link>
          <span style={{ color: "rgba(245,241,232,0.3)", margin: "0 0.5rem" }}>/</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "rgba(245,241,232,0.9)", letterSpacing: "0.1em" }}>{categoryName.toUpperCase()}</span>
        </nav>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "var(--color-cream)", lineHeight: 1 }}>
          {categoryName}
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "rgba(245,241,232,0.6)", marginTop: "1rem" }}>
          {filtered.length} {filtered.length === 1 ? "style" : "styles"}
        </p>
      </div>

      <div style={{ padding: "0 clamp(1.25rem,4vw,5rem)" }}>
        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 0", borderBottom: "1px solid var(--color-border)", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "44px", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", background: "none", border: "1.5px solid var(--color-navy)", padding: "0.5rem 1rem", cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              FILTER {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            {activeFiltersCount > 0 && (
              <button onClick={clearAllFilters} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--color-gray)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Clear all
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--color-navy)", border: "2px solid var(--color-navy)", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)", padding: "0.5rem 0.75rem", backgroundColor: "transparent", cursor: "pointer", letterSpacing: "0.06em" }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* ── Active Filter Chips ── */}
        {activeFiltersCount > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 0", flexWrap: "wrap" }}>
            {selectedSizes.map((s) => (
              <button key={s} onClick={() => toggleSize(s)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", padding: "0.35rem 0.75rem", border: "none", cursor: "pointer" }}>
                Size: {s} ×
              </button>
            ))}
            {selectedColors.map((c) => (
              <button key={c} onClick={() => toggleColor(c)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", padding: "0.35rem 0.75rem", border: "none", cursor: "pointer" }}>
                {c} ×
              </button>
            ))}
            {inStockOnly && (
              <button onClick={() => setInStockOnly(false)} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, color: "var(--color-cream)", backgroundColor: "var(--color-navy)", padding: "0.35rem 0.75rem", border: "none", cursor: "pointer" }}>
                In Stock ×
              </button>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: filterOpen ? "240px 1fr" : "1fr", gap: "2rem", alignItems: "start", paddingBottom: "4rem" }} className="plp-grid">

          {/* ── Filter Panel ── */}
          {filterOpen && (
            <aside style={{ position: "sticky", top: "90px", backgroundColor: "var(--color-cream)", border: "var(--border-thick)", boxShadow: "var(--shadow-md)", padding: "1.5rem" }} className="filter-panel">
              {/* Sizes */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>SIZE</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {allSizes.map((s) => (
                    <button key={s} onClick={() => toggleSize(s)} style={{ padding: "0.35rem 0.6rem", fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: selectedSizes.includes(s) ? "var(--color-cream)" : "var(--color-navy)", backgroundColor: selectedSizes.includes(s) ? "var(--color-navy)" : "transparent", border: "1.5px solid var(--color-navy)", cursor: "pointer", minWidth: "36px" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>COLOR</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {allColors.filter((c) => c?.hex && c?.label).map(({ label, hex }) => (
                    <button key={label} onClick={() => toggleColor(label)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--color-navy)", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontWeight: selectedColors.includes(label) ? 800 : 400 }}>
                      <span style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: hex, border: selectedColors.includes(label) ? "2px solid var(--color-navy)" : "1px solid var(--color-border)", flexShrink: 0 }} />
                      {label}
                      {selectedColors.includes(label) && <span style={{ marginLeft: "auto", fontSize: "0.65rem" }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>MAX PRICE: {fmt(priceMax * 100)}</h3>
                <input type="range" min={500} max={100000} step={500} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--color-navy)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "var(--color-gray)", marginTop: "0.25rem" }}>
                  <span>₹500</span><span>₹1,000</span>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>AVAILABILITY</h3>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} style={{ accentColor: "var(--color-navy)", width: "16px", height: "16px" }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--color-navy)" }}>In Stock Only</span>
                </label>
              </div>
            </aside>
          )}

          {/* ── Product Grid ── */}
          <div>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", paddingTop: "1.5rem" }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i}>
                    <div style={{ aspectRatio: "3/4", backgroundColor: "var(--color-mist)", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <div style={{ height: "0.75rem", backgroundColor: "var(--color-mist)", marginTop: "0.75rem", width: "80%", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <div style={{ height: "0.75rem", backgroundColor: "var(--color-mist)", marginTop: "0.4rem", width: "50%", animation: "pulse 1.5s ease-in-out infinite" }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--color-navy)", marginBottom: "1rem" }}>No products found.</p>
                <button onClick={clearAllFilters} style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", border: "none", padding: "0.875rem 2rem", cursor: "pointer" }}>
                  CLEAR FILTERS
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", paddingTop: "1.5rem" }} className="prod-grid">
                {filtered.map((p) => (
                  <div key={p.id} style={{ position: "relative" }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Badge */}
                    {p.badge && (
                      <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 2, backgroundColor: "var(--color-crimson)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.6rem", letterSpacing: "0.1em", padding: "0.25rem 0.6rem" }}>
                        {p.badge}
                      </div>
                    )}

                    {/* Image */}
                    <Link href={p.href} style={{ display: "block", position: "relative", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-mist)" }}>
                      <Image
                        src={hoveredId === p.id && p.hoverImage ? p.hoverImage : p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: "cover", transition: "opacity 0.3s ease" }}
                      />
                      {/* Quick add */}
                      {hoveredId === p.id && (
                        <button
                          onClick={(e) => { e.preventDefault(); handleQuickAdd(p); }}
                          style={{
                            position: "absolute",
                            bottom: "0.75rem",
                            left: "0.75rem",
                            right: "0.75rem",
                            padding: "0.75rem",
                            backgroundColor: addedId === p.id ? "var(--color-navy)" : "var(--color-cream)",
                            color: addedId === p.id ? "var(--color-cream)" : "var(--color-navy)",
                            fontFamily: "var(--font-sans)",
                            fontWeight: 800,
                            fontSize: "0.65rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {addedId === p.id ? "✓ ADDED" : "+ QUICK ADD"}
                        </button>
                      )}
                    </Link>

                    {/* Info */}
                    <div style={{ paddingTop: "0.75rem" }}>
                      <Link href={p.href} style={{ textDecoration: "none" }}>
                        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-navy)", lineHeight: 1.3, marginBottom: "0.35rem" }}>
                          {p.title}
                        </p>
                      </Link>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <StarRating rating={p.rating} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6rem", color: "var(--color-gray)" }}>({p.reviewCount})</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1rem", color: "var(--color-navy)" }}>{fmt(p.pricePaise)}</span>
                        {p.mrpPaise > p.pricePaise && (
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "#9CA3AF", textDecoration: "line-through" }}>{fmt(p.mrpPaise)}</span>
                        )}
                      </div>
                      {/* Color swatches */}
                      {safeColors(p).length > 0 && (
                        <div style={{ display: "flex", gap: "4px", marginTop: "0.4rem" }}>
                          {safeColors(p).slice(0, 4).map((c) => (
                            <span key={c.label} title={c.label} style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: c.hex, border: "var(--border-thick)", boxShadow: "var(--shadow-md)" }} />
                          ))}
                          {safeColors(p).length > 4 && <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6rem", color: "var(--color-gray)", alignSelf: "center" }}>+{safeColors(p).length - 4}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function CategoryClient(props: CategoryClientProps) {
  return (
    <PLPErrorBoundary slug={props.slug}>
      <CategoryClientInner {...props} />
    </PLPErrorBoundary>
  );
}
