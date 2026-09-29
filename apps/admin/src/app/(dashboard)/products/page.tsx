import React from "react";

export default async function ProductsAdminPage() {
  // Fetch from the main web API
  // In a real prod environment we'd use an internal DNS or monorepo shared library
  let products = [];
  try {
    const res = await fetch(process.env.WEB_URL ? `${process.env.WEB_URL}/api/products` : "http://localhost:3000/api/products", {
      cache: "no-store"
    });
    const data = await res.json();
    products = data.products || [];
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#172545" }}>Products</h2>
        <button style={{ backgroundColor: "#172545", color: "#F5F1E8", border: "none", padding: "0.75rem 1.5rem", borderRadius: "4px", fontWeight: 600, cursor: "pointer" }}>
          + Add Product
        </button>
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F3F4F6", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Image</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>No products found</td>
              </tr>
            ) : (
              products.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "1rem" }}>
                    <img src={p.image} alt={p.title} style={{ width: "50px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "#172545" }}>{p.title}</td>
                  <td style={{ padding: "1rem", color: "#6B7280", textTransform: "capitalize" }}>{p.category}</td>
                  <td style={{ padding: "1rem", fontWeight: 500 }}>₹{(p.pricePaise / 100).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "1rem" }}>
                    <button style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", marginRight: "1rem", fontWeight: 600 }}>Edit</button>
                    <button style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
