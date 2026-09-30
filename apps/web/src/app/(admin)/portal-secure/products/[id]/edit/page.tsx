import React from "react";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import ProductForm from "@/components/admin/ProductForm";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  await connectToDatabase();
  const product = await Product.findById(id).lean();
  if (!product) notFound();

  // Plain JSON for the Client Component (ObjectIds / Dates would fail serialization).
  const serialized = JSON.parse(JSON.stringify(product));
  return <ProductForm initialData={serialized} />;
}
