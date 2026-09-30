"use client";
/**
 * Admin Dashboard — /admin
 *
 * KPI cards + recent orders table + quick actions.
 * All data is mocked — replace with real API calls to backend services.
 */
import React from "react";
import Link from "next/link";

const DEFAULT_KPI_CARDS = [
  { label: "Today's Revenue", value: "₹0", delta: "0%", up: true, sub: "vs yesterday" },
  { label: "Orders Today", value: "0", delta: "0", up: true, sub: "vs yesterday" },
  { label: "Active Products", value: "0", delta: "0", up: true, sub: "no change" },
  { label: "Pending Returns", value: "0", delta: "0", up: true, sub: "vs last week" },
];

// Removed mock RECENT_ORDERS to prevent flashing dummy data before API loads

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Processing: { bg: "rgba(245,158,11,0.15)", text: "#D97706" },
  Shipped: { bg: "rgba(59,130,246,0.15)", text: "#2563EB" },
  Delivered: { bg: "rgba(16,185,129,0.15)", text: "#059669" },
  Pending: { bg: "rgba(156,163,175,0.15)", text: "var(--color-smoke)" },
  Cancelled: { bg: "rgba(201,66,39,0.15)", text: "#C42936" },
};

const QUICK_ACTIONS = [
  { label: "Add New Product", href: "/portal-secure/products/new", icon: "+" },
  { label: "Edit Hero Banner", href: "/portal-secure/cms/hero", icon: "🎨" },
  { label: "Manage Orders", href: "/portal-secure/orders", icon: "📦" },
  { label: "View Analytics", href: "/portal-secure", icon: "📊" },
];

export default function AdminDashboardPage() {
  const [kpis, setKpis] = React.useState(DEFAULT_KPI_CARDS);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.ok ? r.json() : { products: [] }),
      fetch("/api/orders").then(r => r.ok ? r.json() : { orders: [] })
    ]).then(([prodData, ordData]) => {
      const products = prodData.products || [];
      const orders = ordData.orders || [];

      // Calculate revenue (just sum up order totals if they exist, simple mockup calculation from real rows)
      let revenue = 0;
      orders.forEach((o: any) => {
        const val = parseInt((o.total || "0").replace(/[^0-9]/g, ""));
        if (!isNaN(val)) revenue += val;
      });

      setKpis([
        { label: "Total Revenue", value: `₹${revenue.toLocaleString("en-IN")}`, delta: "+5.2%", up: true, sub: "vs last month" },
        { label: "Total Orders", value: orders.length.toString(), delta: "+2", up: true, sub: "vs last week" },
        { label: "Active Products", value: products.length.toString(), delta: "0", up: true, sub: "no change" },
        { label: "Pending Returns", value: "0", delta: "0", up: true, sub: "all good" },
      ]);

      if (orders.length > 0) {
        setRecentOrders(orders.slice(0, 5));
      } else {
        setRecentOrders([]); 
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "2.5rem 3rem" }} className="admin-dashboard">
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-crimson)",
            marginBottom: "0.5rem",
          }}
        >
          Overview
        </p>
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "var(--color-cream)",
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h1>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
        className="kpi-grid"
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: "#1A2332",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem",
              borderRadius: "6px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(245,241,232,0.45)",
                marginBottom: "0.75rem",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "2rem",
                color: "var(--color-cream)",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              {loading ? "..." : kpi.value}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: kpi.up ? "#10B981" : "var(--color-crimson)",
                }}
              >
                {kpi.delta}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.68rem",
                  color: "rgba(245,241,232,0.3)",
                }}
              >
                {kpi.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Orders table + Quick actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: "2rem",
        }}
        className="admin-main-grid"
      >
        {/* Recent Orders */}
        <div
          style={{
            backgroundColor: "#1A2332",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "var(--color-cream)",
              }}
            >
              Recent Orders
            </h2>
            <Link
              href="/portal-secure/orders"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--color-crimson)",
                textDecoration: "none",
              }}
            >
              View all →
            </Link>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                {["Order ID", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(245,241,232,0.35)",
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(245,241,232,0.45)", fontFamily: "var(--font-sans)", fontSize: "0.82rem" }}>
                    No recent orders.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, i) => {
                  const s = STATUS_COLORS[order.status] ?? { bg: "transparent", text: "#9CA3AF" };
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td style={{ padding: "1rem", fontFamily: "var(--font-sans)", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-cream)" }}>
                        <Link href={`/portal-secure/orders/${order.id}`} style={{ textDecoration: "none", color: "var(--color-crimson)" }}>
                          {order.id}
                        </Link>
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "rgba(245,241,232,0.75)" }}>
                        {order.customer}
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "rgba(245,241,232,0.75)", textAlign: "center" }}>
                        {order.items}
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-sans)", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-cream)" }}>
                        {order.total}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: s.text,
                            backgroundColor: s.bg,
                            padding: "4px 10px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "rgba(245,241,232,0.4)", whiteSpace: "nowrap" }}>
                        {order.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Quick Actions */}
          <div
            style={{
              backgroundColor: "#1A2332",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "var(--color-cream)",
                marginBottom: "1.25rem",
              }}
            >
              Quick Actions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "rgba(245,241,232,0.75)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.backgroundColor = "rgba(201,66,39,0.1)";
                    el.style.borderColor = "rgba(201,66,39,0.3)";
                    el.style.color = "var(--color-cream)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.backgroundColor = "rgba(255,255,255,0.03)";
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.color = "rgba(245,241,232,0.75)";
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Store Health */}
          <div
            style={{
              backgroundColor: "#1A2332",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "var(--color-cream)",
                marginBottom: "1.25rem",
              }}
            >
              Store Health
            </h2>
            {[
              { label: "Products with images", value: "98%", good: true },
              { label: "Products in stock", value: "94%", good: true },
              { label: "Orders fulfilled today", value: "100%", good: true },
              { label: "Avg response time", value: "47min", good: true },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "rgba(245,241,232,0.5)" }}>
                  {item.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: item.good ? "#10B981" : "var(--color-crimson)",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .admin-dashboard { padding: 1.5rem !important; }
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
