import React from "react";

export default async function AdminDashboardPage() {
  let stats = { orders: 0, revenue: 0, products: 0 };
  
  try {
    const ordersRes = await fetch(process.env.WEB_URL ? `${process.env.WEB_URL}/api/orders` : "http://localhost:3000/api/orders", { cache: "no-store" });
    const ordersData = await ordersRes.json();
    const orders = ordersData.orders || [];
    
    stats.orders = orders.length;
    stats.revenue = orders.reduce((sum: number, o: any) => sum + (o.totalPaise || 0), 0);
    
    const prodRes = await fetch(process.env.WEB_URL ? `${process.env.WEB_URL}/api/products` : "http://localhost:3000/api/products", { cache: "no-store" });
    const prodData = await prodRes.json();
    stats.products = (prodData.products || []).length;
  } catch (error) {
    console.error("Dashboard stats error:", error);
  }

  const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

  return (
    <div>
      <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#172545", marginBottom: "2rem" }}>Dashboard Overview</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        {/* Stat Card 1 */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Total Revenue</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#172545" }}>{fmt(stats.revenue)}</p>
        </div>
        
        {/* Stat Card 2 */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Total Orders</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#172545" }}>{stats.orders}</p>
        </div>
        
        {/* Stat Card 3 */}
        <div style={{ backgroundColor: "#FFFFFF", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Products</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#172545" }}>{stats.products}</p>
        </div>
      </div>
      
      <div style={{ backgroundColor: "#FFFFFF", padding: "2rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#172545", marginBottom: "1rem" }}>Recent Activity</h3>
        <p style={{ color: "#6B7280" }}>The dashboard is running and connected to the storefront API.</p>
      </div>
    </div>
  );
}
