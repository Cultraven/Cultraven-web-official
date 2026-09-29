"use client";
import React from "react";
import Link from "next/link";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  return (
    <div style={{ padding: "2.5rem 3rem", color: "#F5F1E8" }}>
      <Link href="/admin/orders" style={{ color: "rgba(245,241,232,0.45)", textDecoration: "none", fontSize: "0.72rem", marginBottom: "1rem", display: "inline-block" }}>
        ← Back to Orders
      </Link>
      <h1 style={{ fontSize: "1.75rem", margin: "0 0 2rem 0" }}>Order #{id}</h1>
      
      <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", borderRadius: "6px" }}>
        <p style={{ color: "rgba(245,241,232,0.6)" }}>Order details functionality is currently under development.</p>
        <p style={{ color: "rgba(245,241,232,0.6)", marginTop: "1rem" }}>Please return to the orders list.</p>
      </div>
    </div>
  );
}
