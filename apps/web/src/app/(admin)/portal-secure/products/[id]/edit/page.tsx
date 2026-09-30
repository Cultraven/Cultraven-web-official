import React from "react";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const product = await Product.findById(id).lean();

  if (!product) {
    notFound();
  }

  // Convert ObjectIds to strings to pass to Client Component
  const p = product as any;
  const serializedProduct = {
    ...p,
    _id: p._id.toString(),
  };

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/portal-secure/products" style={{ color: "rgba(245,241,232,0.5)", textDecoration: "none", fontSize: "0.875rem", fontFamily: "var(--font-sans)", display: "inline-block", marginBottom: "1rem" }}>
          ← Back to Products
        </Link>
        <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>
          Edit Product: {serializedProduct.title}
        </h1>
      </div>
      <ProductForm initialData={serializedProduct} />
    </div>
  );
}
