"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const ORDERS = [
  { 
    id: "CR-89241", date: "Sep 24, 2026", status: "Shipped", total: 549800,
    items: [
      { name: "RAVEN OVERSIZED TEE — ACID BLACK", qty: 1, price: 199900, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80" },
      { name: "CARGO WIDE LEG — MILITARY OLIVE", qty: 1, price: 349900, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80" }
    ],
    trackingLink: "#"
  },
  { 
    id: "CR-75312", date: "Aug 12, 2026", status: "Delivered", total: 299900,
    items: [
      { name: "CULTRAVEN RELAXED SHIRT — CREAM", qty: 1, price: 299900, image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=200&auto=format&fit=crop&q=80" }
    ],
    trackingLink: null
  },
];

export default function OrdersPage() {
  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", padding: "clamp(2rem,5vw,5rem) clamp(1.25rem,4vw,5rem)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "3rem" }} className="account-layout">
        {/* Sidebar */}
        <aside>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2.5rem", fontWeight: 600, color: "#172545", marginBottom: "2rem" }}>My Account</h1>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link href="/account" style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#172545")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Dashboard</Link>
            <Link href="/account/orders" style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", padding: "0.75rem 1rem", backgroundColor: "#EAE6DB", borderLeft: "3px solid #172545", textDecoration: "none" }}>Orders</Link>
            <Link href="/account/wishlist" style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#172545")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Wishlist</Link>
            <Link href="/account/addresses" style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#172545")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Addresses</Link>
            <button style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C94227", padding: "0.75rem 1rem", background: "none", border: "none", textAlign: "left", cursor: "pointer", marginTop: "2rem" }}>LOGOUT</button>
          </nav>
        </aside>

        {/* Main Content */}
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#172545", marginBottom: "1.5rem" }}>Order History</h2>
          
          {ORDERS.length === 0 ? (
            <div style={{ backgroundColor: "#EAE6DB", padding: "4rem 2rem", textAlign: "center" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#6B7280", marginBottom: "1.5rem" }}>You haven't placed any orders yet.</p>
              <Link href="/collections/all" style={{ display: "inline-block", padding: "0.875rem 2rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>START SHOPPING</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {ORDERS.map((order) => (
                <div key={order.id} style={{ backgroundColor: "#EAE6DB", border: "1px solid #D9D3C4" }}>
                  {/* Order Header */}
                  <div style={{ padding: "1.25rem", borderBottom: "1px solid #D9D3C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "#172545", marginBottom: "0.25rem" }}>Order {order.id}</p>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>Placed on {order.date}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "#172545", marginBottom: "0.25rem" }}>{fmt(order.total)}</p>
                      <span style={{ display: "inline-block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: order.status === "Delivered" ? "#F5F1E8" : "#172545", backgroundColor: order.status === "Delivered" ? "#172545" : "#D9D3C4", padding: "3px 8px" }}>{order.status}</span>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div style={{ padding: "1.25rem" }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "1rem", marginBottom: idx !== order.items.length - 1 ? "1rem" : 0 }}>
                        <div style={{ position: "relative", width: "80px", aspectRatio: "3/4", backgroundColor: "#D9D3C4" }}>
                          <Image src={item.image} alt={item.name} fill sizes="80px" style={{ objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.75rem", color: "#172545", textTransform: "uppercase", marginBottom: "0.25rem" }}>{item.name}</p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>Qty: {item.qty} · {fmt(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Footer / Actions */}
                  <div style={{ padding: "1rem 1.25rem", backgroundColor: "#D9D3C4", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                    {order.trackingLink && (
                      <a href={order.trackingLink} style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#F5F1E8", backgroundColor: "#172545", padding: "0.6rem 1.25rem", textDecoration: "none" }}>TRACK ORDER</a>
                    )}
                    <button style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545", backgroundColor: "transparent", border: "1.5px solid #172545", padding: "0.6rem 1.25rem", cursor: "pointer" }}>VIEW INVOICE</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .account-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
