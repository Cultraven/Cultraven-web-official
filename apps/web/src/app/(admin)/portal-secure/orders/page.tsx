"use client";
/**
 * Admin: Orders List — /admin/orders
 */
import React, { useState } from "react";
import Link from "next/link";

interface Order {
  id: string; customer: string; email: string;
  items: number; total: string; status: string;
  paymentMethod: string; date: string;
}
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Processing: { bg: "rgba(245,158,11,0.15)", text: "#D97706" },
  Shipped: { bg: "rgba(59,130,246,0.15)", text: "#2563EB" },
  Delivered: { bg: "rgba(16,185,129,0.15)", text: "#059669" },
  Pending: { bg: "rgba(156,163,175,0.15)", text: "#6B7280" },
  Cancelled: { bg: "rgba(201,66,39,0.15)", text: "#C94227" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => {
        if (data.orders) {
          const mapped = data.orders.map((o: any) => ({
            ...o,
            id: o._id || o.id || "N/A",
            customer: o.customer || "Unknown",
          }));
          setOrders(mapped);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.customer.toLowerCase().includes(search.toLowerCase())
  );

  const CELL: React.CSSProperties = {
    padding: "1rem", fontFamily: "Inter, sans-serif", fontSize: "0.78rem",
    color: "rgba(245,241,232,0.75)", borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.4rem" }}>Transactions</p>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#F5F1E8", letterSpacing: "-0.02em" }}>Orders</h1>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order ID or customer..."
          style={{ width: "300px", padding: "0.75rem 1rem", backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#F5F1E8", outline: "none" }}
        />
      </div>

      <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
              {["Order ID", "Customer", "Items", "Total", "Status", "Payment", "Date", "Action"].map(h => (
                <th key={h} style={{ ...CELL, color: "rgba(245,241,232,0.35)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const s = STATUS_COLORS[order.status] || { bg: "transparent", text: "#9CA3AF" };
              return (
                <tr key={order.id}>
                  <td style={{ ...CELL, color: "#F5F1E8", fontWeight: 700 }}>{order.id}</td>
                  <td style={CELL}>
                    <p style={{ color: "#F5F1E8", fontWeight: 600, marginBottom: "2px" }}>{order.customer}</p>
                    <p style={{ fontSize: "0.68rem", color: "rgba(245,241,232,0.4)" }}>{order.email}</p>
                  </td>
                  <td style={CELL}>{order.items}</td>
                  <td style={{ ...CELL, color: "#F5F1E8", fontWeight: 700 }}>{order.total}</td>
                  <td style={CELL}>
                    <span style={{ backgroundColor: s.bg, color: s.text, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "3px", whiteSpace: "nowrap" }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={CELL}>{order.paymentMethod}</td>
                  <td style={{ ...CELL, color: "rgba(245,241,232,0.4)" }}>{order.date}</td>
                  <td style={CELL}>
                    <Link href={`/admin/orders/${order.id}`} style={{ padding: "6px 14px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", textDecoration: "none", borderRadius: "3px" }}>
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
