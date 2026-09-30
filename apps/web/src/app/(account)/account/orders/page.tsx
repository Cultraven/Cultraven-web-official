"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/orders/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error("Failed to fetch orders:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", padding: "clamp(2rem,5vw,5rem) clamp(1.25rem,4vw,5rem)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "3rem" }} className="account-layout">
        {/* Sidebar */}
        <aside>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "2rem" }}>My Account</h1>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link href="/account" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Dashboard</Link>
            <Link href="/account/orders" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", padding: "0.75rem 1rem", backgroundColor: "var(--color-mist)", borderLeft: "3px solid var(--color-navy)", textDecoration: "none" }}>Orders</Link>
            <Link href="/account/wishlist" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Wishlist</Link>
            <Link href="/account/addresses" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", padding: "0.75rem 1rem", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")} onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}>Addresses</Link>
            <button onClick={handleLogout} style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-crimson)", padding: "0.75rem 1rem", background: "none", border: "none", textAlign: "left", cursor: "pointer", marginTop: "2rem" }}>LOGOUT</button>
          </nav>
        </aside>

        {/* Main Content */}
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-navy)", marginBottom: "1.5rem" }}>Order History</h2>
          
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div style={{ backgroundColor: "var(--color-mist)", padding: "4rem 2rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--color-gray)", marginBottom: "1.5rem" }}>You haven't placed any orders yet.</p>
              <Link href="/collections/all" style={{ display: "inline-block", padding: "0.875rem 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>START SHOPPING</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {orders.map((order) => (
                <div key={order._id} style={{ backgroundColor: "var(--color-mist)", border: "var(--border-thick)", boxShadow: "var(--shadow-md)" }}>
                  {/* Order Header */}
                  <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.85rem", color: "var(--color-navy)", marginBottom: "0.25rem" }}>Order {order.razorpayOrderId}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-gray)" }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.9rem", color: "var(--color-navy)", marginBottom: "0.25rem" }}>{fmt(order.totalPaise)}</p>
                      <span style={{ display: "inline-block", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: order.fulfillmentStatus === "delivered" ? "var(--color-cream)" : "var(--color-navy)", backgroundColor: order.fulfillmentStatus === "delivered" ? "var(--color-navy)" : "var(--color-border)", padding: "3px 8px" }}>{order.fulfillmentStatus}</span>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div style={{ padding: "1.25rem" }}>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", gap: "1rem", marginBottom: idx !== order.items.length - 1 ? "1rem" : 0 }}>
                        <div style={{ position: "relative", width: "80px", aspectRatio: "3/4", backgroundColor: "var(--color-border)" }}>
                          <Image src={item.image} alt={item.title} fill sizes="80px" style={{ objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.75rem", color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "0.25rem" }}>{item.title}</p>
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-gray)" }}>Qty: {item.quantity} · {fmt(item.pricePaise)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Footer / Actions */}
                  <div style={{ padding: "1rem 1.25rem", backgroundColor: "var(--color-border)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                    {order.trackingLink && (
                      <a href={order.trackingLink} style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-cream)", backgroundColor: "var(--color-navy)", padding: "0.6rem 1.25rem", textDecoration: "none" }}>TRACK ORDER</a>
                    )}
                    <button style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-navy)", backgroundColor: "transparent", border: "1.5px solid var(--color-navy)", padding: "0.6rem 1.25rem", cursor: "pointer" }}>VIEW INVOICE</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
