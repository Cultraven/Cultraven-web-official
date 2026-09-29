import React from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F1E8", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: "260px", backgroundColor: "#172545", color: "#F5F1E8", padding: "2rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            CULTRAVEN
          </h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(245,241,232,0.6)", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin Portal</p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/" style={{ color: "#F5F1E8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Dashboard</Link>
          <Link href="/products" style={{ color: "#F5F1E8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Products</Link>
          <Link href="/orders" style={{ color: "#F5F1E8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Orders</Link>
          <Link href="/customers" style={{ color: "#F5F1E8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Customers</Link>
          <Link href="/settings" style={{ color: "#F5F1E8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Settings</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Logged in as Admin</span>
        </header>
        {children}
      </main>
    </div>
  );
}
