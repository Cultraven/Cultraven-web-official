"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", slug: "", description: "", pricePaise: "", mrpPaise: "",
    category: "T-Shirts", fit: "Oversized", stock: "", imageSrc: "",
  });

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch("/api/products")
        .then(res => res.json())
        .then(data => {
          const product = data.products?.find((x: any) => x._id === p.id || x.id === p.id);
          if (product) {
            setForm({
              title: product.title || "",
              slug: product.slug || "",
              description: product.description || "",
              pricePaise: product.pricePaise?.toString() || "",
              mrpPaise: product.mrpPaise?.toString() || "",
              category: product.category || "T-Shirts",
              fit: product.fit || "Oversized",
              stock: product.stockCount?.toString() || "0",
              imageSrc: product.image || "",
            });
          }
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, slug: form.slug, description: form.description,
          pricePaise: parseInt(form.pricePaise) || 0, mrpPaise: parseInt(form.mrpPaise) || 0,
          category: form.category, fit: form.fit, stockCount: parseInt(form.stock) || 0,
          image: form.imageSrc, hoverImage: form.imageSrc,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      alert("Product updated!");
      router.push("/admin/products");
    } catch {
      alert("Error updating product");
    } finally {
      setSaving(false);
    }
  };

  const INPUT: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem", backgroundColor: "#0F1419", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#F5F1E8",
  };
  const LABEL: React.CSSProperties = {
    display: "block", fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,241,232,0.45)", marginBottom: "0.4rem",
  };

  if (loading) return <div style={{ padding: "2.5rem 3rem", color: "#F5F1E8" }}>Loading...</div>;

  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/admin/products" style={{ color: "rgba(245,241,232,0.45)", textDecoration: "none", fontSize: "0.72rem", display: "inline-block", marginBottom: "0.5rem" }}>← Back</Link>
        <h1 style={{ color: "#F5F1E8", fontSize: "1.75rem", margin: 0 }}>Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", borderRadius: "6px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Title</label><input required style={INPUT} value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Slug</label><input required style={INPUT} value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Description</label><textarea required rows={4} style={{ ...INPUT, resize: "vertical" }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div>
        </div>

        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", borderRadius: "6px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div><label style={LABEL}>Price (₹)</label><input required type="number" style={INPUT} value={form.pricePaise} onChange={e => setForm({...form, pricePaise: e.target.value})} /></div>
            <div><label style={LABEL}>MRP (₹)</label><input required type="number" style={INPUT} value={form.mrpPaise} onChange={e => setForm({...form, mrpPaise: e.target.value})} /></div>
            <div><label style={LABEL}>Stock</label><input required type="number" style={INPUT} value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={LABEL}>Image URL</label><input required type="url" style={INPUT} value={form.imageSrc} onChange={e => setForm({...form, imageSrc: e.target.value})} /></div>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ padding: "0.875rem 2rem", backgroundColor: "#C94227", color: "#F5F1E8", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", border: "none", borderRadius: "4px" }}>
          {saving ? "Saving..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
