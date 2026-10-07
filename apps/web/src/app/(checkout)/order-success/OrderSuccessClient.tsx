"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useBuyNowStore } from "@/store/buyNow";
import Confetti from "react-confetti";
import "@/styles/orders.css";
import { mailtoLink, supportConfig, whatsappLink } from "@/lib/support";

export interface OrderSummary {
  number: string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: string;
  items: { title: string; image: string; size: string; color: string; quantity: number; pricePaise: number }[];
  subtotalPaise: number; discountPaise: number; shippingPaise: number; codFeePaise: number; totalPaise: number;
  address: { name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string };
}

interface Props {
  summary?: OrderSummary | null;
  emailOn?: boolean;
  orderId?: string;
  paymentId?: string;
  isConfirmed: boolean;
  orderData: { email: string; amountPaise: number } | null;
}

export default function OrderSuccessClient({ orderId, paymentId, isConfirmed, orderData, summary, emailOn }: Props) {
  const { clearCart } = useCartStore();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  const amountPaise = orderData?.amountPaise || 0;
  const email = orderData?.email || "";
  const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

  useEffect(() => {
    // An express (BUY NOW) order must not empty the shopper's cart.
    const express = useBuyNowStore.getState();
    if (express.item) express.clear(); else clearCart();
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    if (isConfirmed) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(t);
    }
  }, [clearCart, isConfirmed]);

  return (
    <div className="os-page" style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(1rem,3vw,2rem)", paddingTop: "calc(clamp(1rem,3vw,2rem) + 80px)" }}>
      {showConfetti && windowSize.width > 0 && (
        <Confetti width={windowSize.width} height={windowSize.height} colors={["var(--color-navy)", "var(--color-crimson)", "var(--color-yellow)", "var(--color-mist)", "#FFFFFF"]} recycle={false} numberOfPieces={400} gravity={0.14} />
      )}

      <div className="os-page-card" style={{ backgroundColor: "var(--color-cream)", padding: "clamp(1.5rem,5vw,5rem)", maxWidth: "600px", width: "100%", textAlign: "center", border: "var(--border-thick)", boxShadow: "var(--shadow-md)", zIndex: 10, position: "relative" }}>
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
              {email && emailOn && <> A confirmation email is on its way to <strong style={{ color: "var(--color-navy)" }}>{email}</strong>.</>}
            </p>

            {(paymentId || amountPaise > 0) && (
              <div style={{ backgroundColor: "var(--color-bone)", border: "2px solid var(--color-navy)", padding: "1.1rem 1.25rem", marginBottom: "1.5rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {summary ? (
                  <div className="os-meta"><span>Order number</span><b>{summary.number}</b></div>
                ) : orderId ? (
                  <div className="os-meta"><span>Order number</span><b>CR-{orderId.slice(-6).toUpperCase()}</b></div>
                ) : null}
                {paymentId && <div className="os-meta"><span>Payment ID</span><b style={{ wordBreak: "break-all" }}>{paymentId}</b></div>}
                {amountPaise > 0 && (
                  <div className="os-meta"><span>{summary?.paymentMethod === "cod" ? "To pay on delivery" : "Amount paid"}</span><b style={{ fontSize: "1.1rem" }}>{fmt(amountPaise)}</b></div>
                )}
                <div className="os-meta"><span>Est. delivery</span><b>3–5 business days</b></div>
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

        {summary ? (
          <div className="os-sum">
            <p className="os-no">Order <b>{summary.number}</b></p>
            {summary.items.map((i, k) => (
              <div key={k} className="os-line"><span>{i.title}<small>{[i.size, i.color].filter(Boolean).join(" · ")} · Qty {i.quantity}</small></span><b>{fmt(i.pricePaise * i.quantity)}</b></div>
            ))}
            <div className="os-line"><span>Subtotal</span><b>{fmt(summary.subtotalPaise)}</b></div>
            {summary.discountPaise > 0 ? <div className="os-line"><span>Discount</span><b>−{fmt(summary.discountPaise)}</b></div> : null}
            <div className="os-line"><span>Shipping</span><b>{summary.shippingPaise === 0 ? "FREE" : fmt(summary.shippingPaise)}</b></div>
            {summary.codFeePaise > 0 ? <div className="os-line"><span>COD fee</span><b>{fmt(summary.codFeePaise)}</b></div> : null}
            <div className="os-line os-total"><span>{summary.paymentMethod === "cod" ? "Pay on delivery" : "Total"}</span><b>{fmt(summary.totalPaise)}</b></div>
            <p className="os-h">Delivering to</p>
            <p className="os-addr">{summary.address.name}<br />{summary.address.line1}{summary.address.line2 ? `, ${summary.address.line2}` : ""}<br />{summary.address.city}, {summary.address.state} {summary.address.pincode}<br />Phone: {summary.address.phone}</p>
            <p className="os-h">Payment</p>
            <p className="os-addr">{summary.paymentMethod === "cod" ? "Cash on Delivery" : summary.paymentStatus === "paid" ? "Paid online" : "Online payment (pending)"} · Est. delivery 3–5 business days</p>
          </div>
        ) : null}

        <p className="os-help">🚀 Shipping &amp; tracking updates will be sent via WhatsApp. Questions about your order?</p>
        <div className="os-help-links">
          <a href={whatsappLink(`Hi CULTRAVEN, I need help with my order${summary ? ` ${summary.number}` : ""}.`)}>WhatsApp us</a>
          <a href={mailtoLink(`Help with my order${summary ? ` ${summary.number}` : ""}`)}>{supportConfig().email}</a>
        </div>

        <div className="os-actions">
          {orderId && summary ? (
            <>
              <Link href={`/account/orders/${orderId}`} className="os-btn os-btn-primary">TRACK MY ORDER</Link>
              <a href={`/api/orders/${orderId}/invoice`} className="os-btn os-btn-outline">DOWNLOAD RECEIPT (PDF)</a>
            </>
          ) : null}
          <div className="os-actions-row">
            <Link href="/collections/all" className="os-btn os-btn-solid">CONTINUE SHOPPING</Link>
            <Link href="/account/orders" className="os-btn os-btn-ghost">VIEW ORDERS</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
