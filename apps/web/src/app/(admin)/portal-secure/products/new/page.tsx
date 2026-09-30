import React from "react";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/portal-secure/products" style={{ color: "rgba(245,241,232,0.5)", textDecoration: "none", fontSize: "0.875rem", fontFamily: "var(--font-sans)", display: "inline-block", marginBottom: "1rem" }}>
          ← Back to Products
        </Link>
        <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "#F5F1E8", letterSpacing: "-0.02em" }}>
          Add New Product
        </h1>
      </div>
      <ProductForm />
    </div>
  );
}
