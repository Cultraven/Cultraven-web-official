"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";

interface WishlistItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  pricePaise: number;
  category: string;
}

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const WISHLIST_KEY = "cultraven-wishlist";

function getWishlist(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const { addItem } = useCartStore();

  useEffect(() => {
    setItems(getWishlist());
  }, []);

  const remove = (productId: string) => {
    const updated = items.filter((i) => i.productId !== productId);
    setItems(updated);
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated)); } catch {}
  };

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", paddingBottom: "6rem" }}>
      {/* Header */}
      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "3rem", paddingBottom: "2rem", borderBottom: "1px solid var(--color-line)" }}>
        <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)", textDecoration: "none", marginBottom: "1rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="15 18 9 12 15 6"/></svg>
          Account
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          WISHLIST
        </h1>
      </div>

      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "2.5rem", display: "grid", gridTemplateColumns: "240px 1fr", gap: "3rem", alignItems: "start" }} className="account-grid">
        {/* Sidebar */}
        <div style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-navy)", position: "sticky", top: "140px" }}>
          {[
            { label: "Orders", href: "/account", icon: "📦" },
            { label: "Wishlist", href: "/account/wishlist", icon: "♡" },
            { label: "Shop", href: "/collections/all", icon: "🛍" },
          ].map(({ label, href, icon }) => (
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase", color: href === "/account/wishlist" ? "var(--color-navy)" : "var(--color-gray)", textDecoration: "none", borderBottom: label !== "Shop" ? "1px solid var(--color-line)" : "none", backgroundColor: href === "/account/wishlist" ? "rgba(23,37,84,0.05)" : "transparent" }}>
              <span style={{ fontSize: "1rem" }}>{icon}</span> {label}
            </Link>
          ))}
        </div>

        {/* Main content */}
        <div>
          {items.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", backgroundColor: "white", border: "2px solid var(--color-line)" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-navy)", marginBottom: "0.5rem" }}>NOTHING SAVED YET</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)", marginBottom: "2rem" }}>Heart an item to save it here.</p>
              <Link href="/collections/all" style={{ display: "inline-block", padding: "0.875rem 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", boxShadow: "3px 3px 0px var(--color-lava)" }}>
                BROWSE DROPS
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {items.map((item) => (
                <div key={item.productId} style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", boxShadow: "3px 3px 0px var(--color-navy)" }}>
                  <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
                    <Image src={item.image} alt={item.title} fill sizes="280px" style={{ objectFit: "cover" }} />
                    <button onClick={() => remove(item.productId)} aria-label="Remove from wishlist" style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "32px", height: "32px", backgroundColor: "white", border: "1.5px solid var(--color-navy)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-crimson)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", color: "var(--color-navy)", letterSpacing: "0.02em", marginBottom: "4px", lineHeight: 1.3 }}>{item.title}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.9rem", color: "var(--color-navy)", marginBottom: "0.75rem" }}>{fmt(item.pricePaise)}</p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={`/products/${item.slug}`} style={{ flex: 1, padding: "0.625rem", backgroundColor: "transparent", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", border: "1.5px solid var(--color-navy)", textAlign: "center" }}>
                        VIEW
                      </Link>
                      <button
                        onClick={() => {
                          addItem({ productId: item.productId, slug: item.slug, title: item.title, image: item.image, sku: `${item.productId}-default`, size: "M", color: "", pricePaise: item.pricePaise });
                        }}
                        style={{ flex: 2, padding: "0.625rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", border: "1.5px solid var(--color-navy)" }}
                      >
                        ADD TO BAG
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .account-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
