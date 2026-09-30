"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import Confetti from "react-confetti";

interface Props {
  orderId?: string;
  paymentId?: string;
  isConfirmed: boolean;
  orderData: { email: string; amountPaise: number } | null;
}

export default function OrderSuccessClient({ orderId, paymentId, isConfirmed, orderData }: Props) {
  const { clearCart } = useCartStore();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  const amountPaise = orderData?.amountPaise || 0;
  const email = orderData?.email || "";
  const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

  useEffect(() => {
    clearCart();
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    if (isConfirmed) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(t);
    }
  }, [clearCart, isConfirmed]);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", paddingTop: "calc(2rem + 80px)" }}>
      {showConfetti && windowSize.width > 0 && (
        <Confetti width={windowSize.width} height={windowSize.height} colors={["var(--color-navy)", "var(--color-crimson)", "var(--color-yellow)", "var(--color-mist)", "#FFFFFF"]} recycle={false} numberOfPieces={400} gravity={0.14} />
      )}

      <div style={{ backgroundColor: "var(--color-cream)", padding: "clamp(3rem,5vw,5rem)", maxWidth: "600px", width: "100%", textAlign: "center", border: "var(--border-thick)", boxShadow: "var(--shadow-md)", zIndex: 10, position: "relative" }}>
        {isConfirmed ? (
          <>
            <div style={{ width: "64px", height: "64px", backgroundColor: "var(--color-navy)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.75rem" }}>ORDER CONFIRMED</p>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.1, marginBottom: "1.5rem" }}>
              Thank you for your purchase.
            </h1>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.7, marginBottom: "2rem" }}>
              Your order has been successfully placed and is being processed.
              {email && <> A confirmation email has been sent to <strong style={{ color: "var(--color-navy)" }}>{email}</strong>.</>}
            </p>

            {(paymentId || amountPaise > 0) && (
              <div style={{ backgroundColor: "var(--color-mist)", padding: "1.25rem 1.5rem", marginBottom: "2rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {orderId && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Order ID</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-navy)" }}>{orderId}</span>
                  </div>
                )}
                {paymentId && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Payment ID</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-navy)" }}>{paymentId}</span>
                  </div>
                )}
                {amountPaise > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Amount Paid</span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-navy)" }}>{fmt(amountPaise)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Est. Delivery</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-navy)" }}>3–5 Business Days</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ width: "64px", height: "64px", backgroundColor: "var(--color-mist)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-gray)", marginBottom: "0.75rem" }}>PAYMENT PENDING</p>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.1, marginBottom: "1.5rem" }}>
              We're waiting for payment confirmation.
            </h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.92rem", color: "#4B5563", lineHeight: 1.7, marginBottom: "2rem" }}>
              Your order is currently marked as pending. Once the payment is verified, we will process it immediately.
            </p>
          </>
        )}

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-gray)", marginBottom: "2rem", lineHeight: 1.6 }}>
          🚀 Shipping & tracking updates will be sent via WhatsApp. For queries:{" "}
          <a href="https://wa.me/919876543210" style={{ color: "var(--color-navy)", fontWeight: 700 }}>WhatsApp</a>{" "}or{" "}
          <a href="mailto:support@cultraven.com" style={{ color: "var(--color-navy)", fontWeight: 700 }}>support@cultraven.com</a>
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
          <Link href="/collections/all" style={{ display: "block", width: "100%", padding: "1.1rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>CONTINUE SHOPPING</Link>
          <Link href="/account/orders" style={{ display: "block", width: "100%", padding: "1rem", backgroundColor: "transparent", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", border: "1.5px solid var(--color-navy)" }}>VIEW ORDERS</Link>
        </div>
      </div>
    </div>
  );
}
