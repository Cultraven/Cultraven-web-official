"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrderDetailsClient({ id }: { id: string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.order) setOrder(data.order);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: status }),
      });
      if (res.ok) {
        setOrder({ ...order, fulfillmentStatus: status });
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2.5rem 3rem", color: "var(--color-cream)", fontFamily: "var(--font-sans)" }}>Loading...</div>;
  }

  if (!order) {
    return (
      <div style={{ padding: "2.5rem 3rem", color: "var(--color-cream)", fontFamily: "var(--font-sans)" }}>
        Order not found.
        <br/><br/>
        <Link href="/portal-secure/orders" style={{ color: "var(--color-crimson)" }}>Back to Orders</Link>
      </div>
    );
  }

  const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/portal-secure/orders" style={{ color: "rgba(245,241,232,0.5)", textDecoration: "none", fontSize: "0.875rem", fontFamily: "var(--font-sans)", display: "inline-block", marginBottom: "1rem" }}>
          ← Back to Orders
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>
            Order {order.razorpayOrderId}
          </h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-sans)", color: "rgba(245,241,232,0.5)", fontSize: "0.875rem" }}>Update Status:</span>
            <select
              value={order.fulfillmentStatus || "processing"}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={updating}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#1A2332",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-cream)",
                borderRadius: "4px",
                fontFamily: "var(--font-sans)",
                outline: "none"
              }}
            >
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-cream)", marginBottom: "1.5rem" }}>Order Items</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {order.items?.map((item: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < order.items.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingBottom: i < order.items.length - 1 ? "1.5rem" : "0" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.title} style={{ width: "60px", height: "75px", objectFit: "cover", borderRadius: "4px" }} />
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem", color: "var(--color-cream)", marginBottom: "4px" }}>{item.title}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "rgba(245,241,232,0.5)" }}>Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, color: "var(--color-cream)" }}>
                    {fmt(item.pricePaise)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem", color: "rgba(245,241,232,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Customer Details</h3>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)", fontSize: "0.9rem", marginBottom: "4px" }}><strong>Name:</strong> {order.deliveryAddress?.name}</p>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)", fontSize: "0.9rem", marginBottom: "4px" }}><strong>Email:</strong> {order.deliveryAddress?.email}</p>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)", fontSize: "0.9rem", marginBottom: "4px" }}><strong>Phone:</strong> {order.deliveryAddress?.phone}</p>
          </div>

          <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem", color: "rgba(245,241,232,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Shipping Address</h3>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              {order.deliveryAddress?.addressLine1}<br/>
              {order.deliveryAddress?.addressLine2 && <>{order.deliveryAddress?.addressLine2}<br/></>}
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.pincode}
            </p>
          </div>

          <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem", color: "rgba(245,241,232,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Payment Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-sans)", color: "rgba(245,241,232,0.7)" }}>Subtotal</span>
              <span style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)" }}>{fmt(order.totalPaise)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "1rem" }}>
              <span style={{ fontFamily: "var(--font-sans)", color: "rgba(245,241,232,0.7)" }}>Shipping</span>
              <span style={{ fontFamily: "var(--font-sans)", color: "#10B981" }}>FREE</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)", fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: "var(--font-sans)", color: "var(--color-cream)", fontWeight: 700, fontSize: "1.2rem" }}>{fmt(order.totalPaise)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
