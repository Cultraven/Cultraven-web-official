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
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const FREE_SHIPPING_THRESHOLD = 199900;

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, setQuantity } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9900;
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

  return (
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
          backgroundColor: "#F5F1E8",
          zIndex: 9999,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(23,37,69,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #D9D3C4",
            backgroundColor: "#172545",
          }}
        >
          <div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#F5F1E8", margin: 0 }}>
              YOUR BAG
            </h2>
            {items.length > 0 && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "rgba(245,241,232,0.6)", margin: "0.15rem 0 0", letterSpacing: "0.06em" }}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#F5F1E8",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div style={{ padding: "0.875rem 1.5rem", backgroundColor: "#EAE6DB", borderBottom: "1px solid #D9D3C4" }}>
            {toFree > 0 ? (
              <>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#172545", marginBottom: "0.5rem" }}>
                  Add <strong>{fmt(toFree)}</strong> more for free shipping
                </p>
                <div style={{ height: "3px", backgroundColor: "#D9D3C4", borderRadius: "2px" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      backgroundColor: "#172545",
                      borderRadius: "2px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </>
            ) : (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "#172545", letterSpacing: "0.08em" }}>
                🎉 FREE SHIPPING UNLOCKED
              </p>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 1.5rem" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🛍️</div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "1.5rem", color: "#172545", marginBottom: "0.75rem" }}>
                Your bag is empty.
              </p>
              <button
                onClick={onClose}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div
                  key={item.sku}
                  style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "1rem", padding: "1.25rem 0", borderBottom: "1px solid #D9D3C4" }}
                >
                  <Link href={`/products/${item.slug}`} onClick={onClose} style={{ position: "relative", display: "block", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB", flexShrink: 0 }}>
                    <Image src={item.image} alt={item.title} fill sizes="80px" style={{ objectFit: "cover" }} />
                  </Link>
                  <div>
                    <Link href={`/products/${item.slug}`} onClick={onClose} style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#172545", display: "block", marginBottom: "0.3rem", textDecoration: "none", lineHeight: 1.3 }}>
                      {item.title}
                    </Link>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "#6B7280", marginBottom: "0.15rem" }}>{item.size && `Size: ${item.size}`}{item.color && ` · ${item.color}`}</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#172545", marginBottom: "0.75rem" }}>
                      {fmt(item.pricePaise)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #D9D3C4" }}>
                        <button onClick={() => updateQty(item.sku, -1)} aria-label="Decrease" style={{ width: "28px", height: "28px", background: "none", border: "none", cursor: "pointer", color: "#172545", fontSize: "1rem" }}>−</button>
                        <span style={{ width: "28px", textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#172545" }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.sku, 1)} aria-label="Increase" style={{ width: "28px", height: "28px", background: "none", border: "none", cursor: "pointer", color: "#172545", fontSize: "1rem" }}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.sku)} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C94227", background: "none", border: "none", cursor: "pointer" }}>
                        REMOVE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #D9D3C4", backgroundColor: "#EAE6DB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#172545" }}>SUBTOTAL</span>
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "1.35rem", color: "#172545" }}>
                {fmt(subtotal)}
              </span>
            </div>
            {shipping > 0 && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "#6B7280", marginBottom: "1rem" }}>
                +{fmt(shipping)} shipping · Free above ₹1,999
              </p>
            )}
            <Link
              href="/checkout"
              onClick={onClose}
              style={{ display: "block", width: "100%", padding: "1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", marginBottom: "0.75rem" }}
            >
              CHECKOUT
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              style={{ display: "block", width: "100%", padding: "0.875rem", backgroundColor: "transparent", color: "#172545", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", border: "1.5px solid #172545" }}
            >
              VIEW FULL BAG
            </Link>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.62rem", color: "#6B7280", textAlign: "center", marginTop: "0.75rem", letterSpacing: "0.04em" }}>
              🔒 Secure · UPI · Cards · COD
            </p>
          </div>
        )}
      </div>
    </>
  );
}
