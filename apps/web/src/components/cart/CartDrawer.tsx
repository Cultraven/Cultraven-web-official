"use client";
/**
 * CartDrawer — Slide-in cart sidebar from the right.
 *
 * Opens automatically when an item is added via addItem().
 * Can also be opened by clicking the cart icon in the Header.
 *
 * Uses Zustand useCartStore for live cart data.
 * Provides: quantity update, remove, proceed to checkout.
 */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, setQuantity } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const updateQty = (sku: string, delta: number) => {
    const item = items.find((i) => i.sku === sku);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) removeItem(sku);
    else setQuantity(sku, newQty);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(23,37,69,0.5)",
          zIndex: 9998,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 95vw)",
          backgroundColor: "var(--color-cream)",
          zIndex: 9999,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          borderLeft: "var(--border-thick)",
          boxShadow: "-8px 0 0 rgba(23,37,69,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "var(--border-thick)",
            backgroundColor: "var(--color-cream)",
          }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: "20px", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-navy)", margin: 0 }}>
              YOUR BAG
            </h2>
            {items.length > 0 && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, color: "var(--color-crimson)", margin: "0.15rem 0 0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              background: "var(--color-navy)",
              border: "2px solid var(--color-navy)",
              cursor: "pointer",
              color: "var(--color-cream)",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "2px 2px 0px 0px var(--color-navy)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div style={{ padding: "0.875rem 1.5rem", backgroundColor: "var(--color-mist)", borderBottom: "var(--border-thick)" }}>
            {toFree > 0 ? (
              <>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, color: "var(--color-navy)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  AUR <strong style={{ color: "var(--color-crimson)", fontFamily: "var(--font-mono)" }}>{fmt(toFree)}</strong> DAAL FOR FREE SHIPPING
                </p>
                <div style={{ height: "12px", backgroundColor: "var(--color-cream)", border: "2px solid var(--color-navy)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      backgroundColor: "var(--color-navy)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </>
            ) : (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, color: "var(--color-navy)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🎉 SCENE SET HAI. FREE SHIPPING!
              </p>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", flex: 1 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="2" strokeLinecap="square" style={{ margin: "0 auto 1rem" }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 400, color: "var(--color-navy)", marginBottom: "1.5rem", textTransform: "uppercase" }}>
                BAG KHALI HAI BRO.
              </p>
              <button
                onClick={onClose}
                style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", border: "2px solid var(--color-navy)", padding: "12px 24px", cursor: "pointer", boxShadow: "4px 4px 0px 0px var(--color-navy)" }}
              >
                AUR DIKHAO
              </button>
            </div>
          ) : (
            <>
              <div style={{ padding: "0 1.5rem" }}>
                {items.map((item) => (
                  <div
                    key={item.sku}
                    style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "1rem", padding: "1.25rem 0", borderBottom: "var(--border-thick)" }}
                  >
                    <Link href={`/products/${item.slug}`} onClick={onClose} style={{ position: "relative", display: "block", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-mist)", flexShrink: 0, border: "2px solid var(--color-navy)", boxShadow: "2px 2px 0px 0px var(--color-navy)" }}>
                      <Image src={item.image} alt={item.title} fill sizes="80px" style={{ objectFit: "cover" }} />
                    </Link>
                    <div>
                      <Link href={`/products/${item.slug}`} onClick={onClose} style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-navy)", display: "block", marginBottom: "0.3rem", textDecoration: "none", lineHeight: 1.3 }}>
                        {item.title}
                      </Link>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--color-gray)", marginBottom: "0.15rem", textTransform: "uppercase" }}>{item.size && `SIZE: ${item.size}`}{item.color && ` · ${item.color}`}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "16px", color: "var(--color-navy)", marginBottom: "0.25rem" }}>
                        {fmt(item.pricePaise)}
                      </p>
                      {item.mrpPaise && item.mrpPaise > item.pricePaise && (
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: "9px", fontWeight: 900, color: "var(--color-crimson)", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
                          FINAL SALE - NO RETURNS
                        </p>
                      )}
                      {!item.mrpPaise || item.mrpPaise <= item.pricePaise ? <div style={{ marginBottom: "0.75rem" }} /> : null}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "2px solid var(--color-navy)", boxShadow: "2px 2px 0px 0px var(--color-navy)", backgroundColor: "var(--color-cream)" }}>
                          <button onClick={() => updateQty(item.sku, -1)} aria-label="Decrease" style={{ width: "28px", height: "28px", background: "none", border: "none", cursor: "pointer", color: "var(--color-navy)", fontSize: "1rem", fontWeight: 900 }}>−</button>
                          <span style={{ width: "28px", textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", color: "var(--color-navy)" }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.sku, 1)} aria-label="Increase" style={{ width: "28px", height: "28px", background: "none", border: "none", cursor: "pointer", color: "var(--color-navy)", fontSize: "1rem", fontWeight: 900 }}>+</button>
                        </div>
                        <button onClick={() => removeItem(item.sku)} style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-crimson)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          HATAO
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Upsell Section (Always visible) */}
          <div style={{ padding: "1.5rem", backgroundColor: "var(--color-mist)", marginTop: "auto" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: "18px", letterSpacing: "0.02em", color: "var(--color-navy)", marginBottom: "1rem", textTransform: "uppercase" }}>YOU MIGHT ALSO LIKE</p>
            <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }} className="hide-scrollbar">
              {[
                { id: "al1", title: "DHARMA GRAPHIC HOODIE", price: 299900, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80", href: "/products/dharma-graphic-hoodie-stone" },
                { id: "al2", title: "CARGO WIDE LEG", price: 349900, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80", href: "/products/cargo-wide-leg-military-olive" }
              ].map((p) => (
                <div key={p.id} style={{ minWidth: "140px", backgroundColor: "var(--color-cream)", border: "2px solid var(--color-navy)", boxShadow: "2px 2px 0px 0px var(--color-navy)", padding: "8px" }}>
                  <Link href={p.href} onClick={onClose} style={{ display: "block" }}>
                    <div style={{ position: "relative", aspectRatio: "3/4", border: "2px solid var(--color-navy)", marginBottom: "8px" }}>
                      <Image src={p.image} alt={p.title} fill sizes="140px" style={{ objectFit: "cover" }} />
                    </div>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "10px", color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "12px", color: "var(--color-navy)" }}>{fmt(p.price)}</p>
                      <span style={{ backgroundColor: "var(--color-navy)", color: "var(--color-cream)", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>+</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "var(--border-thick)", backgroundColor: "var(--color-mist)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "14px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-navy)" }}>SUBTOTAL</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "24px", color: "var(--color-navy)", textShadow: "2px 2px 0px rgba(23,37,69,0.2)" }}>
                {fmt(subtotal)}
              </span>
            </div>
            {shipping > 0 && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, color: "var(--color-crimson)", marginBottom: "1rem", textTransform: "uppercase" }}>
                +{fmt(shipping)} SHIPPING · FREE ABOVE ₹1,999
              </p>
            )}
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-primary"
              style={{ display: "block", width: "100%", padding: "16px", marginBottom: "0.75rem", fontSize: "16px" }}
            >
              CHECKOUT
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              style={{ display: "block", width: "100%", padding: "14px", backgroundColor: "transparent", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px 0px var(--color-navy)" }}
            >
              VIEW FULL BAG
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>,
    document.body
  );
}
