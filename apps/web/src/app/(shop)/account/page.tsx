"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SavedOrder {
  orderNumber: string;
  totalPaise: number;
  placedAt: string;
  items?: string[];
}

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const ORDERS_KEY = "cultraven-orders";

function getSavedOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function AccountPage() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    setOrders(getSavedOrders());
  }, []);

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", paddingBottom: "6rem" }}>
      {/* Header */}
      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "3rem", paddingBottom: "2rem", borderBottom: "1px solid var(--color-line)" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)", textDecoration: "none", marginBottom: "1rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="15 18 9 12 15 6"/></svg>
          Home
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          MY ACCOUNT
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
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase", color: href === "/account" ? "var(--color-navy)" : "var(--color-gray)", textDecoration: "none", borderBottom: label !== "Shop" ? "1px solid var(--color-line)" : "none", backgroundColor: href === "/account" ? "rgba(23,37,84,0.05)" : "transparent" }}>
              <span style={{ fontSize: "1rem" }}>{icon}</span> {label}
            </Link>
          ))}
        </div>

        {/* Main content */}
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, color: "var(--color-navy)", marginBottom: "1.5rem", textTransform: "uppercase" }}>
            Order History
          </h2>

          {orders.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", backgroundColor: "white", border: "2px solid var(--color-line)" }}>
              <div style={{ width: "56px", height: "56px", backgroundColor: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "3px 3px 0px var(--color-lava)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="square">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-navy)", marginBottom: "0.5rem" }}>NO ORDERS YET</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)", marginBottom: "2rem" }}>Your orders placed on this device will appear here.</p>
              <Link href="/collections/all" style={{ display: "inline-block", padding: "0.875rem 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", boxShadow: "3px 3px 0px var(--color-lava)" }}>
                SHOP NOW
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {orders.map((order) => (
                <div key={order.orderNumber} style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", padding: "1.5rem", boxShadow: "3px 3px 0px var(--color-navy)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.9rem", color: "var(--color-navy)", letterSpacing: "0.08em" }}>{order.orderNumber}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--color-gray)", marginTop: "4px" }}>
                        {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.9rem", color: "var(--color-navy)" }}>{fmt(order.totalPaise)}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", border: "1.5px solid var(--color-lava)", color: "var(--color-lava)" }}>
                        PROCESSING
                      </span>
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
