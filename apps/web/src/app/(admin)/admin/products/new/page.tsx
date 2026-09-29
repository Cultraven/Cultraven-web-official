"use client";
/**
 * Admin: Add New Product — /admin/products/new
 */
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Basic form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    pricePaise: "",
    mrpPaise: "",
    category: "T-Shirts",
    fit: "Oversized",
    stock: "",
    imageSrc: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          pricePaise: parseInt(form.pricePaise) || 0,
          mrpPaise: parseInt(form.mrpPaise) || 0,
          category: form.category,
          fit: form.fit,
          stockCount: parseInt(form.stock) || 0,
          image: form.imageSrc,
          hoverImage: form.imageSrc,
          colors: [{ hex: "#0A0A0A", label: "Black" }], // Default for now
          sizes: ["S", "M", "L", "XL"],
          inStock: parseInt(form.stock) > 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to save product");
      
      setSaving(false);
      alert("Product added successfully!");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      alert("Error adding product");
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, imageSrc: data.url }));
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch {
      alert("Error uploading file.");
    }
  };
  const INPUT: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem", backgroundColor: "#0F1419",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px",
    fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#F5F1E8",
  };
  const LABEL: React.CSSProperties = {
    display: "block", fontFamily: "Inter, sans-serif", fontSize: "0.65rem",
    fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "rgba(245,241,232,0.45)", marginBottom: "0.4rem",
  };

  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <Link href="/admin/products" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "rgba(245,241,232,0.45)", textDecoration: "none", marginBottom: "0.5rem", display: "inline-block" }}>
            ← Back to Products
          </Link>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#F5F1E8", letterSpacing: "-0.02em" }}>
            Add New Product
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "2rem" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F5F1E8", marginBottom: "1.5rem" }}>Basic Info</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Product Title</label>
              <input required style={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Acid State Heavyweight Tee" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Slug (URL)</label>
              <input required style={INPUT} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="acid-state-heavyweight-tee" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Description</label>
              <textarea required rows={4} style={{ ...INPUT, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Write a compelling product description..." />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "2rem" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F5F1E8", marginBottom: "1.5rem" }}>Pricing & Inventory</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={LABEL}>Selling Price (₹)</label>
              <input required type="number" style={INPUT} value={form.pricePaise} onChange={(e) => setForm({ ...form, pricePaise: e.target.value })} placeholder="1999" />
            </div>
            <div>
              <label style={LABEL}>MRP (₹)</label>
              <input required type="number" style={INPUT} value={form.mrpPaise} onChange={(e) => setForm({ ...form, mrpPaise: e.target.value })} placeholder="2499" />
            </div>
            <div>
              <label style={LABEL}>Initial Stock Quantity</label>
              <input required type="number" style={INPUT} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "2rem" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F5F1E8", marginBottom: "1.5rem" }}>Organization</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={LABEL}>Category</label>
              <select style={INPUT} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>T-Shirts</option><option>Shirts</option><option>Hoodies</option><option>Cargos</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>Fit</label>
              <select style={INPUT} value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })}>
                <option>Oversized</option><option>Relaxed</option><option>Regular</option><option>Slim</option>
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Image Upload / URL</label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ ...INPUT, flex: 1, padding: "0.6rem 1rem" }} />
                <input required type="url" style={{ ...INPUT, flex: 2 }} value={form.imageSrc} onChange={(e) => setForm({ ...form, imageSrc: e.target.value })} placeholder="Or paste image URL https://..." />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <Link href="/admin/products" style={{ padding: "0.875rem 1.5rem", backgroundColor: "transparent", color: "rgba(245,241,232,0.7)", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.82rem", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px" }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} style={{ padding: "0.875rem 2rem", backgroundColor: "#C94227", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
