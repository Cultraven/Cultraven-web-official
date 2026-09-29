import React from "react";

export default async function OrdersAdminPage() {
  let orders = [];
  try {
    const res = await fetch(process.env.WEB_URL ? `${process.env.WEB_URL}/api/orders` : "http://localhost:3000/api/orders", {
      cache: "no-store"
    });
    const data = await res.json();
    orders = data.orders || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#172545" }}>Orders</h2>
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F3F4F6", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order ID</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fulfillment</th>
              <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>No orders found</td>
              </tr>
            ) : (
              orders.map((o: any) => (
                <tr key={o._id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "#172545" }}>{o.razorpayOrderId}</td>
                  <td style={{ padding: "1rem", color: "#6B7280" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "1rem" }}>{o.deliveryAddress?.name} <br/> <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>{o.deliveryAddress?.email}</span></td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>{fmt(o.totalPaise)}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: o.paymentStatus === 'paid' ? '#D1FAE5' : '#FEE2E2', color: o.paymentStatus === 'paid' ? '#065F46' : '#991B1B' }}>
                      {o.paymentStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, backgroundColor: o.fulfillmentStatus === 'delivered' ? '#D1FAE5' : '#FEF3C7', color: o.fulfillmentStatus === 'delivered' ? '#065F46' : '#92400E' }}>
                      {o.fulfillmentStatus?.toUpperCase() || 'PROCESSING'}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <button style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontWeight: 600 }}>View</button>
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
