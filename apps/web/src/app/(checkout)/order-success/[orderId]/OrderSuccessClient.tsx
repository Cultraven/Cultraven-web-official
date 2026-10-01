"use client";
/**
 * OrderSuccessClient — /order-success/[orderId]
 * Wrapped in Suspense to allow useSearchParams in production builds.
 */
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";
import Confetti from "react-confetti";

interface OrderSuccessClientProps {
  orderId: string;
}

function OrderSuccessContent({ orderId }: OrderSuccessClientProps) {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  const orderNumber = `CR-${orderId.slice(-6).toUpperCase()}`;
  const paymentId = searchParams.get("payment_id");
  const amountPaise = Number(searchParams.get("amount") || 0);
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";

  const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

  useEffect(() => {
    // An express (COP IT NOW) order must not empty the shopper's bag.
    const express = useBuyNowStore.getState();
    if (express.item) express.clear(); else clearCart();
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, [clearCart]);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", paddingTop: "calc(2rem + 80px)" }}>
      {showConfetti && windowSize.width > 0 && (
        <Confetti width={windowSize.width} height={windowSize.height} colors={["var(--color-navy)", "var(--color-crimson)", "var(--color-yellow)", "var(--color-mist)", "#FFFFFF"]} recycle={false} numberOfPieces={450} gravity={0.12} />
      )}

      <div style={{ backgroundColor: "var(--color-cream)", padding: "clamp(2.5rem,5vw,5rem)", maxWidth: "600px", width: "100%", textAlign: "center", border: "var(--border-thick)", boxShadow: "var(--shadow-md)", position: "relative", zIndex: 10 }}>
        <div style={{ width: "64px", height: "64px", backgroundColor: "var(--color-navy)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.75rem" }}>ORDER CONFIRMED</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Thank you{name ? `, ${name.split(" ")[0]}` : ""}.
        </h1>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.7, marginBottom: "2rem" }}>
          Your order <strong style={{ color: "var(--color-navy)" }}>{orderNumber}</strong> has been successfully placed.
          {email && <> Confirmation sent to <strong style={{ color: "var(--color-navy)" }}>{email}</strong>.</>}
        </p>

        <div style={{ backgroundColor: "var(--color-mist)", padding: "1.5rem", marginBottom: "2rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Order Number</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 800, color: "var(--color-navy)" }}>{orderNumber}</span>
          </div>
          {paymentId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Payment ID</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-navy)" }}>{paymentId}</span>
            </div>
          )}
          {amountPaise > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Amount Paid</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-navy)" }}>{fmt(amountPaise)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Est. Delivery</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-navy)" }}>3–5 Business Days</span>
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--color-gray)", marginBottom: "2rem", lineHeight: 1.6 }}>
          🚀 Shipping & tracking updates via WhatsApp.{" "}
          <a href="https://wa.me/919876543210" style={{ color: "var(--color-navy)", fontWeight: 700 }}>Contact us</a>{" "}or{" "}
          <a href="mailto:support@cultraven.com" style={{ color: "var(--color-navy)", fontWeight: 700 }}>support@cultraven.com</a>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link href="/account/orders" style={{ display: "block", padding: "1.1rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>VIEW ORDER HISTORY</Link>
          <Link href="/collections/all" style={{ display: "block", padding: "1rem", backgroundColor: "transparent", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", border: "1.5px solid var(--color-navy)" }}>CONTINUE SHOPPING</Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessClient({ orderId }: OrderSuccessClientProps) {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-gray)", fontSize: "0.85rem" }}>Loading order details…</div>
      </div>
    }>
      <OrderSuccessContent orderId={orderId} />
    </Suspense>
  );
}
