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
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
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
          backgroundColor: "var(--color-stone)",
          zIndex: 9999,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          borderLeft: "2px solid var(--color-raven)",
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
            borderBottom: "2px solid var(--color-raven)",
            backgroundColor: "var(--color-stone)",
          }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: "20px", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-raven)", margin: 0 }}>
              YOUR BAG
            </h2>
            {items.length > 0 && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, margin: "0.15rem 0 0", letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--color-lava)", color: "var(--color-navy)", padding: "2px 8px", display: "inline-block" }}>
                {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              background: "var(--color-raven)",
              border: "2px solid var(--color-raven)",
              cursor: "pointer",
              color: "var(--color-bone)",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "2px 2px 0px 0px var(--color-raven)",
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
          <div style={{ padding: "0.875rem 1.5rem", backgroundColor: "var(--color-stone)", borderBottom: "2px solid var(--color-raven)" }}>
            {toFree > 0 ? (
              <>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, color: "var(--color-navy)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  ADD <strong style={{ color: "var(--color-lava)", fontFamily: "var(--font-mono)" }}>{fmt(toFree)}</strong> MORE FOR FREE SHIPPING
                </p>
                <div style={{ height: "8px", backgroundColor: "var(--color-bone)", border: "2px solid var(--color-navy)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      backgroundColor: "var(--color-lava)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </>
            ) : (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, color: "var(--color-raven)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🎉 FREE SHIPPING UNLOCKED!
              </p>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-raven)" strokeWidth="2" strokeLinecap="square" style={{ margin: "0 auto 1rem" }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, color: "var(--color-raven)", marginBottom: "1.5rem" }}>
                Bag's empty. Start with the new drop.
              </p>
              <Link
                href="/collections/new-in"
                onClick={onClose}
                style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", backgroundColor: "var(--color-lava)", border: "2px solid var(--color-navy)", padding: "12px 24px", cursor: "pointer", boxShadow: "4px 4px 0px 0px var(--color-navy)", textDecoration: "none" }}
              >
                SHOP NEW DROPS
              </Link>
            </div>
          ) : (
            <>
              <div style={{ padding: "0 1.5rem" }}>
                {items.map((item) => (
                  <div
                    key={item.sku}
                    style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "1rem", padding: "1.25rem 0", borderBottom: "var(--border-thick)" }}
                  >
                    <Link href={`/products/${item.slug}`} onClick={onClose} style={{ position: "relative", display: "block", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "var(--color-bone)", flexShrink: 0, border: "2px solid var(--color-raven)", boxShadow: "2px 2px 0px 0px var(--color-raven)" }}>
                      <Image src={item.image} alt={item.title} fill sizes="80px" style={{ objectFit: "cover" }} />
                    </Link>
                    <div>
                      <Link href={`/products/${item.slug}`} onClick={onClose} style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-raven)", display: "block", marginBottom: "0.3rem", textDecoration: "none", lineHeight: 1.3 }}>
                        {item.title}
                      </Link>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: "var(--color-smoke)", marginBottom: "0.15rem", textTransform: "uppercase" }}>{item.size && `SIZE: ${item.size}`}{item.color && ` · ${item.color}`}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "16px", color: "var(--color-raven)", marginBottom: "0.25rem" }}>
                        {fmt(item.pricePaise)}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "2px solid var(--color-raven)", boxShadow: "2px 2px 0px 0px var(--color-raven)", backgroundColor: "var(--color-bone)" }}>
                          <button onClick={() => updateQty(item.sku, -1)} aria-label="Decrease" style={{ width: "28px", height: "28px", background: "none", border: "none", cursor: "pointer", color: "var(--color-raven)", fontSize: "1rem", fontWeight: 900 }}>−</button>
                          <span style={{ width: "28px", textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", color: "var(--color-raven)" }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.sku, 1)} aria-label="Increase" style={{ width: "28px", height: "28px", background: "none", border: "none", cursor: "pointer", color: "var(--color-raven)", fontSize: "1rem", fontWeight: 900 }}>+</button>
                        </div>
                        <button onClick={() => removeItem(item.sku)} style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Upsell Section (Only if items exist) */}
          {items.length > 0 && (
            <div style={{ padding: "1.5rem", backgroundColor: "var(--color-bone)", marginTop: "auto", borderTop: "2px solid var(--color-raven)" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ position: "relative", width: "60px", aspectRatio: "1", border: "2px solid var(--color-raven)", flexShrink: 0, backgroundColor: "var(--color-line)" }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontFamily: "var(--font-mono)", color: "var(--color-smoke)", textAlign: "center" }} data-todo="real-photo">CAP IMAGE</div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "11px", color: "var(--color-raven)", textTransform: "uppercase", marginBottom: "4px" }}>Add a Cult Cap?</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "12px", color: "var(--color-smoke)", marginBottom: "4px" }}>{fmt(99900)}</p>
                </div>
                <button style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "10px", padding: "6px 12px", border: "2px solid var(--color-raven)", backgroundColor: "var(--color-bone)", color: "var(--color-raven)", cursor: "pointer", boxShadow: "2px 2px 0px 0px var(--color-raven)" }}>
                  ADD
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "var(--border-thick)", backgroundColor: "var(--color-stone)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "14px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-raven)" }}>SUBTOTAL</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "24px", color: "var(--color-raven)", textShadow: "2px 2px 0px rgba(23,37,69,0.2)" }}>
                {fmt(subtotal)}
              </span>
            </div>
            
            {/* Trust Row */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1rem", fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, color: "var(--color-smoke)", textTransform: "uppercase" }}>
              <span>UPI</span>
              <span>·</span>
              <span>COD</span>
              <span>·</span>
              <span>7-DAY RETURNS</span>
            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              style={{ display: "block", width: "100%", padding: "16px", marginBottom: "0.75rem", fontSize: "16px", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px 0px var(--color-navy)", transition: "transform 0.1s ease, box-shadow 0.1s ease" }}
            >
              CHECKOUT
            </Link>
          </div>
        )}
      </div>

    </>,
    document.body
  );
}
