/**
 * BestsellersSection — "THE ONES EVERYONE WANTS."
 *
 * Horizontal snap-scroll carousel of 6 bestselling products.
 * Mist (var(--color-mist)) background for section alternation.
 * Cards include rating stars, hover swap, wishlist, quick-add.
 */
"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface BestProduct {
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
  badge?: "BESTSELLER" | "LOW STOCK";
}

const BESTSELLERS: BestProduct[] = [
  {
    id: "bs-1",
    title: "CLASSIC OVERSIZED TEE — BLACK",
    href: "/products/classic-oversized-tee-black",
    image:
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    pricePaise: 189900,
    mrpPaise: 189900,
    rating: 5,
    reviewCount: 248,
    colors: [
      { hex: "#0A0A0A", label: "Black" },
      { hex: "var(--color-cream)", label: "White" },
      { hex: "var(--color-navy)", label: "Navy" },
    ],
    badge: "BESTSELLER",
  },
  {
    id: "bs-2",
    title: "DRAGON BLOOD GRAPHIC — CHARCOAL",
    href: "/products/dragon-blood-graphic-charcoal",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    pricePaise: 249900,
    mrpPaise: 299900,
    rating: 5,
    reviewCount: 184,
    colors: [
      { hex: "#2C2C2C", label: "Charcoal" },
      { hex: "var(--color-navy)", label: "Navy" },
    ],
    badge: "BESTSELLER",
  },
  {
    id: "bs-3",
    title: "ESSENTIALS HOODIE — WASHED NAVY",
    href: "/products/essentials-hoodie-washed-navy",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&auto=format&fit=crop&q=80",
    pricePaise: 319900,
    mrpPaise: 399900,
    rating: 4,
    reviewCount: 132,
    colors: [
      { hex: "var(--color-navy)", label: "Washed Navy" },
      { hex: "#0A0A0A", label: "Jet Black" },
      { hex: "var(--color-gray)", label: "Ash" },
    ],
  },
  {
    id: "bs-4",
    title: "LAVA STRIPE CARGO — SAND",
    href: "/products/lava-stripe-cargo-sand",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80",
    pricePaise: 379900,
    mrpPaise: 499900,
    rating: 5,
    reviewCount: 97,
    colors: [
      { hex: "#C4A882", label: "Sand" },
      { hex: "#556B2F", label: "Olive" },
      { hex: "#0A0A0A", label: "Black" },
    ],
    badge: "LOW STOCK",
  },
  {
    id: "bs-5",
    title: "ACID STATE SWEATSHIRT — STONE",
    href: "/products/acid-state-sweatshirt-stone",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80",
    pricePaise: 259900,
    mrpPaise: 319900,
    rating: 4,
    reviewCount: 76,
    colors: [
      { hex: "var(--color-mist)", label: "Stone" },
      { hex: "#9CA3AF", label: "Washed Grey" },
    ],
  },
  {
    id: "bs-6",
    title: "CULTRAVEN RELAXED SHIRT — WHITE",
    href: "/products/relaxed-shirt-white",
    image:
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&auto=format&fit=crop&q=80",
    hoverImage:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    pricePaise: 299900,
    mrpPaise: 299900,
    rating: 5,
    reviewCount: 61,
    colors: [
      { hex: "#FFFFFF", label: "White" },
      { hex: "var(--color-mist)", label: "Cream" },
      { hex: "var(--color-navy)", label: "Navy" },
    ],
    badge: "BESTSELLER",
  },
];

const fallbackProducts = BESTSELLERS;

const fmt = (p: number) => `\u20b9${(p / 100).toLocaleString("en-IN")}`;

// ─── Section ──────────────────────────────────────────────────────────────────

export function BestsellersSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<BestProduct[]>(fallbackProducts);

  React.useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          const mapped = data.products
            .filter((p: any) => p.pricePaise != null)
            .slice(0, 6)
            .map((p: any) => ({
            id: p.id || p._id,
            title: p.title,
            href: `/products/${p.slug || p.id}`,
            image: p.image || fallbackProducts[0].image,
            hoverImage: p.hoverImage || p.image || fallbackProducts[0].hoverImage,
            pricePaise: p.pricePaise,
            mrpPaise: p.mrpPaise || p.pricePaise,
            rating: p.rating || 0,
            reviewCount: p.reviewCount || 0,
            colors: Array.isArray(p.colors)
              ? p.colors
                  .filter((c: any) => c && typeof c.hex === "string" && typeof c.label === "string")
                  .map((c: any) => ({ hex: String(c.hex), label: String(c.label) }))
              : [{ hex: "#0A0A0A", label: "Black" }],
            badge: "BESTSELLER" as const,
          }));
          setProducts(mapped);
        }
      })
      .catch(console.error);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" });
  };

  return (
    <section
      aria-labelledby="bs-heading"
      style={{ backgroundColor: "var(--color-mist)", padding: "clamp(4rem,8vw,8rem) 0" }}
    >
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
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--color-crimson)",
                marginBottom: "0.6rem",
              }}
            >
              Customer Favourites
            </span>
            <h2
              id="bs-heading"
              style={{
                fontFamily: "var(--font-heading)",
                
                fontSize: "clamp(2rem,4.5vw,3.75rem)",
                fontWeight: 600,
                color: "var(--color-navy)",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              The Ones Everyone Wants.
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              href="/collections/bestsellers"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-navy)",
                borderBottom: "2px solid var(--color-navy)",
                paddingBottom: "2px",
                marginRight: "1rem",
              }}
            >
              VIEW ALL
            </Link>
            {/* Scroll arrows */}
            {(["left", "right"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-navy)",
                  background: "transparent",
                  color: "var(--color-navy)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-navy)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-cream)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy)";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {dir === "left" ? (
                    <polyline points="15 18 9 12 15 6" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: "1.25rem",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            width: "100%",
          }}
          className="bs-scroll"
        >
          {products.map((p) => (
            <BestsellerCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <style>{`
        .bs-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .bs-card { width: calc(50vw - 2rem) !important; min-width: 140px !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────

function BestsellerCard({ product: p }: { product: BestProduct }) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const slug = p.href.replace(/^\/products\//, "");

  const disc = Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100);

  return (
    <div
      className="bs-card"
      style={{
        flexShrink: 0,
        width: "clamp(200px, 22vw, 290px)",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link
        href={p.href}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "4/5",
          maxHeight: "360px",
          overflow: "hidden",
          backgroundColor: "var(--color-cream)",
          marginBottom: "0.85rem",
        }}
      >
        {/* Badge */}
        {p.badge && (
          <span
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              zIndex: 10,
              backgroundColor:
                p.badge === "LOW STOCK" ? "var(--color-crimson)" : "var(--color-navy)",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontSize: "9px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "4px 8px",
            }}
          >
            {p.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((w) => !w);
          }}
          aria-label="Toggle wishlist"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            background: "rgba(245,241,232,0.92)",
            border: "none",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: hovered || wishlisted ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={wishlisted ? "var(--color-crimson)" : "none"}
            stroke={wishlisted ? "var(--color-crimson)" : "var(--color-navy)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <Image
          src={hovered ? p.hoverImage : p.image}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{
            objectFit: "cover",
            transition: "opacity 0.35s ease, transform 0.65s ease",
            transform: hovered ? "scale(1.04)" : "scale(1)",
          }}
        />

        {/* Quick Add */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0.75rem",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.28s ease",
            zIndex: 10,
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem({
                productId: p.id,
                slug,
                title: p.title,
                image: p.image,
                sku: `${p.id}-free`,
                size: "Free Size",
                color: p.colors?.[0]?.label ?? "Default",
                pricePaise: p.pricePaise,
                mrpPaise: p.mrpPaise,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: added ? "var(--color-crimson)" : "var(--color-navy)",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.65rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {added ? "ADDED \u2713" : "QUICK ADD"}
          </button>
        </div>
      </Link>

      {/* Info */}
      <div>
        {/* Rating */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}
        >
          <div style={{ display: "flex", gap: "2px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill={i < p.rating ? "var(--color-crimson)" : "none"}
                stroke={i < p.rating ? "var(--color-crimson)" : "var(--color-border)"}
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: "var(--color-gray)",
            }}
          >
            ({p.reviewCount})
          </span>
        </div>

        {/* Colors */}
        <div style={{ display: "flex", gap: "5px", marginBottom: "7px" }}>
          {(p.colors ?? []).filter((c) => c?.hex).map((c) => (
            <div
              key={c.hex}
              title={c.label}
              style={{
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                backgroundColor: c.hex,
                border: "1.5px solid rgba(23,37,69,0.2)",
              }}
            />
          ))}
        </div>

        <Link
          href={p.href}
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "0.7rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-navy)",
            marginBottom: "5px",
            lineHeight: 1.35,
          }}
        >
          {p.title}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "var(--color-navy)",
            }}
          >
            {fmt(p.pricePaise)}
          </span>
          {disc > 0 && (
            <>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "0.72rem",
                  color: "var(--color-gray)",
                  textDecoration: "line-through",
                }}
              >
                {fmt(p.mrpPaise)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  color: "var(--color-crimson)",
                }}
              >
                {disc}% off
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
