"use client";
/**
 * Cart Page — /cart
 *
 * Reads from Zustand useCartStore (localStorage-persisted).
 * Full cart page: quantity update, remove, free shipping bar, coupon, checkout CTA.
 */
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const FREE_SHIPPING_THRESHOLD = 199900; // ₹1,999

export default function CartPage() {
  const { items, removeItem, setQuantity, clearCart } = useCartStore();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9900;
  const total = subtotal - discount + shipping;
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const updateQty = (sku: string, delta: number) => {
    const item = items.find((i) => i.sku === sku);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(sku);
    } else {
      setQuantity(sku, newQty);
    }
  };

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "CULTRAVEN10") {
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code.");
      setCouponApplied(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", padding: "clamp(2rem,5vw,5rem) clamp(1.25rem,4vw,5rem)", paddingTop: "calc(clamp(2rem,5vw,5rem) + 80px)" }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 600, color: "#172545", marginBottom: "2.5rem" }}>
        Shopping Bag
        {items.length > 0 && (
          <span style={{ fontFamily: "var(--font-sans)", fontStyle: "normal", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", color: "#6B7280", marginLeft: "1rem" }}>
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        )}
      </h1>

      {/* ── Empty State ── */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🛍️</div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "#172545", marginBottom: "0.75rem" }}>Your bag is empty.</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "#6B7280", marginBottom: "2rem" }}>Discover our latest drops and add them to your bag.</p>
          <Link
            href="/collections/all"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "1rem 2.5rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "3rem", alignItems: "start" }} className="cart-grid">
          {/* ── Cart Items ── */}
          <div>
            {/* Free shipping bar */}
            {toFreeShipping > 0 && (
              <div style={{ backgroundColor: "#EAE6DB", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", fontWeight: 700, color: "#172545", marginBottom: "0.5rem" }}>
                  Add <strong>{fmt(toFreeShipping)}</strong> more for FREE SHIPPING
                </p>
                <div style={{ height: "4px", backgroundColor: "#D9D3C4", borderRadius: "2px" }}>
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
              </div>
            )}
            {toFreeShipping === 0 && (
              <div style={{ backgroundColor: "#172545", color: "#F5F1E8", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                🎉 YOU&apos;VE UNLOCKED FREE SHIPPING!
              </div>
            )}

            <div style={{ borderTop: "1px solid #D9D3C4" }}>
              {items.map((item) => (
                <div
                  key={item.sku}
                  style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1.5rem", padding: "1.5rem 0", borderBottom: "1px solid #D9D3C4" }}
                >
                  <Link href={`/products/${item.slug}`} style={{ position: "relative", display: "block", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#EAE6DB" }}>
                    <Image src={item.image} alt={item.title} fill sizes="120px" style={{ objectFit: "cover" }} />
                  </Link>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <Link href={`/products/${item.slug}`} style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "#172545", display: "block", marginBottom: "0.4rem", textDecoration: "none" }}>
                        {item.title}
                      </Link>
                      {item.color && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#6B7280", marginBottom: "0.2rem" }}>Color: {item.color}</p>}
                      {item.size && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#6B7280", marginBottom: "1rem" }}>Size: {item.size}</p>}
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1rem", color: "#172545" }}>
                        {fmt(item.pricePaise * item.quantity)}
                        {item.quantity > 1 && (
                          <span style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 400, marginLeft: "0.5rem" }}>
                            ({fmt(item.pricePaise)} ea)
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                      {/* Qty stepper */}
                      <div style={{ display: "flex", alignItems: "center", border: "2px solid #172545", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)" }}>
                        <button
                          onClick={() => updateQty(item.sku, -1)}
                          aria-label="Decrease quantity"
                          style={{ width: "36px", height: "36px", background: "none", border: "none", cursor: "pointer", color: "#172545", fontSize: "1.1rem" }}
                        >
                          −
                        </button>
                        <span style={{ width: "36px", textAlign: "center", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.sku, 1)}
                          aria-label="Increase quantity"
                          style={{ width: "36px", height: "36px", background: "none", border: "none", cursor: "pointer", color: "#172545", fontSize: "1.1rem" }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.sku)}
                        style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C94227", background: "none", border: "none", cursor: "pointer" }}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: "1.5rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/collections/all"
                style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", borderBottom: "2px solid #172545", paddingBottom: "2px", textDecoration: "none" }}
              >
                ← CONTINUE SHOPPING
              </Link>
              <button
                onClick={clearCart}
                style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Clear bag
              </button>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div style={{ backgroundColor: "#EAE6DB", padding: "2rem", position: "sticky", top: "100px" }}>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "1.5rem" }}>ORDER SUMMARY</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #D9D3C4" }}>
              <Row label="Subtotal" value={fmt(subtotal)} />
              {couponApplied && <Row label="Discount (CULTRAVEN10)" value={`−${fmt(discount)}`} highlight />}
              <Row label="Shipping" value={shipping === 0 ? "FREE" : fmt(shipping)} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545" }}>TOTAL</span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "1.5rem", color: "#172545" }}>{fmt(total)}</span>
            </div>

            {/* Coupon */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>HAVE A COUPON?</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={coupon}
                  onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  placeholder="Enter code"
                  style={{ flex: 1, padding: "0.6rem 0.875rem", border: "2px solid #172545", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)", backgroundColor: "#F5F1E8", fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "#172545", outline: "none" }}
                />
                <button
                  onClick={applyCoupon}
                  style={{ padding: "0.6rem 1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer" }}
                >
                  APPLY
                </button>
              </div>
              {couponError && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#C94227", marginTop: "0.4rem" }}>{couponError}</p>}
              {couponApplied && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#172545", fontWeight: 700, marginTop: "0.4rem" }}>✓ Coupon applied — 10% off!</p>}
            </div>

            <Link
              href="/checkout"
              style={{ display: "block", width: "100%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", textDecoration: "none", marginBottom: "0.75rem" }}
            >
              PROCEED TO CHECKOUT
            </Link>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "#6B7280", textAlign: "center", letterSpacing: "0.06em" }}>
              🔒 Secure checkout · UPI · Cards · COD
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .cart-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "#6B7280" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: highlight ? "#C94227" : "#172545" }}>{value}</span>
    </div>
  );
}
