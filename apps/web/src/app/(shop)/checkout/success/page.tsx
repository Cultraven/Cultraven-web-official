"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

function SuccessContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order") || "CR-XXXXXX";
  const totalPaise = parseInt(params.get("total") || "0", 10);

  React.useEffect(() => {
    if (!orderNumber || orderNumber === "CR-XXXXXX") return;
    try {
      const key = "cultraven-orders";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      if (!existing.find((o: { orderNumber: string }) => o.orderNumber === orderNumber)) {
        existing.unshift({ orderNumber, totalPaise, placedAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
      }
    } catch {}
  }, [orderNumber, totalPaise]);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "80dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem clamp(1rem,4vw,5rem)", textAlign: "center" }}>
      {/* Icon */}
      <div style={{ width: "80px", height: "80px", backgroundColor: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem", boxShadow: "6px 6px 0px var(--color-lava)" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="square">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 400, color: "var(--color-navy)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.02em" }}>
        ORDER CONFIRMED
      </h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)", letterSpacing: "0.08em", marginBottom: "2.5rem" }}>
        YOU&apos;RE OFFICIALLY PART OF THE CULTURE.
      </p>

      <div style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", padding: "2rem 2.5rem", maxWidth: "480px", width: "100%", boxShadow: "6px 6px 0px var(--color-navy)", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--color-line)", marginBottom: "1rem" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Order Number</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.1rem", fontWeight: 900, color: "var(--color-navy)", letterSpacing: "0.08em" }}>{orderNumber}</span>
        </div>

        {totalPaise > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>Total Paid</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.1rem", fontWeight: 900, color: "var(--color-navy)" }}>{fmt(totalPaise)}</span>
          </div>
        )}

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--color-gray)", marginTop: "1.25rem", lineHeight: 1.6 }}>
          Your order will be processed and shipped within 1–2 business days. You&apos;ll receive a confirmation SMS/email once it&apos;s on the way.
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/collections/all" style={{ display: "inline-block", padding: "1rem 2.5rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px 0px var(--color-lava)" }}>
          KEEP SHOPPING
        </Link>
        <Link href="/account" style={{ display: "inline-block", padding: "1rem 2.5rem", backgroundColor: "transparent", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px 0px var(--color-navy)" }}>
          VIEW ORDERS
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "var(--color-cream)", minHeight: "80dvh" }} />}>
      <SuccessContent />
    </Suspense>
  );
}
