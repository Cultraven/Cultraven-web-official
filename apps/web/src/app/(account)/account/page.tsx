"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const RECENT_ORDERS = [
  { id: "CR-89241", date: "Sep 24, 2026", status: "Shipped", items: 2, total: 549800 },
];

export default function AccountDashboard() {
  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", padding: "clamp(2rem,5vw,5rem) clamp(1.25rem,4vw,5rem)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "3rem" }} className="account-layout">
        {/* Sidebar */}
        <aside>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "2rem" }}>My Account</h1>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link href="/account" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", padding: "0.75rem 1rem", backgroundColor: "var(--color-mist)", borderLeft: "3px solid var(--color-navy)", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/account/orders" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Orders</Link>
            <Link href="/account/wishlist" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Wishlist</Link>
            <Link href="/account/addresses" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Addresses</Link>
            <button style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-crimson)", padding: "0.75rem 1rem", background: "none", border: "none", textAlign: "left", cursor: "pointer", marginTop: "2rem" }}>LOGOUT</button>
          </nav>
        </aside>

        {/* Main Content */}
        <div>
          {/* Welcome Banner */}
          <div style={{ backgroundColor: "var(--color-navy)", padding: "2.5rem", color: "var(--color-cream)", marginBottom: "2rem" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.5rem" }}>CULTRAVEN INSIDER</p>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", marginBottom: "0.75rem" }}>Welcome back, Rohan.</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "rgba(245,241,232,0.7)" }}>Tier: <strong>CULT MEMBER</strong> (Next tier unlocks at ₹10,000 spend)</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }} className="dashboard-grid">
            {/* Recent Orders */}
            <div style={{ backgroundColor: "var(--color-mist)", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)" }}>RECENT ORDERS</h3>
                <Link href="/account/orders" style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-gray)", textDecoration: "underline" }}>View All</Link>
              </div>
              {RECENT_ORDERS.length > 0 ? (
                <div>
                  {RECENT_ORDERS.map((o) => (
                    <div key={o.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)" }}>{o.id}</span>
                        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-navy)", backgroundColor: "var(--color-border)", padding: "3px 8px" }}>{o.status}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "#4B5563", marginBottom: "0.25rem" }}>{o.date} · {o.items} items</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)" }}>{fmt(o.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)" }}>You have no recent orders.</p>
              )}
            </div>

            {/* Profile & Addresses */}
            <div style={{ backgroundColor: "var(--color-mist)", padding: "2rem" }}>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "1.5rem" }}>ACCOUNT DETAILS</h3>
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)", marginBottom: "0.25rem" }}>Rohan Sharma</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)" }}>rohan.sharma@example.com</p>
                <button style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-navy)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "0.5rem" }}>Edit Profile</button>
              </div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "1rem" }}>DEFAULT ADDRESS</h3>
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.6 }}>Rohan Sharma<br/>A-14, Hauz Khas Enclave<br/>New Delhi, Delhi 110016<br/>India</p>
                <Link href="/account/addresses" style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-navy)", textDecoration: "underline", display: "inline-block", marginTop: "0.5rem" }}>Manage Addresses</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .account-layout { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .dashboard-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
