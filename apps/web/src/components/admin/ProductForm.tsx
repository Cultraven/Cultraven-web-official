"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    pricePaise: initialData?.pricePaise || 0,
    mrpPaise: initialData?.mrpPaise || 0,
    description: initialData?.description || "",
    category: initialData?.category || "T-Shirts",
    image: initialData?.image || "",
    hoverImage: initialData?.hoverImage || "",
    inStock: initialData ? initialData.inStock : true,
    sizes: initialData?.sizes?.join(", ") || "S, M, L, XL",
    badge: initialData?.badge || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      pricePaise: parseInt(formData.pricePaise.toString()),
      mrpPaise: parseInt(formData.mrpPaise.toString()),
      sizes: formData.sizes.split(",").map((s: string) => s.trim()).filter(Boolean),
    };

    try {
      const url = initialData ? `/api/products/${initialData._id}` : "/api/products";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/portal-secure/products");
        router.refresh();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    padding: "0.875rem",
    backgroundColor: "#0F1419",
    border: "1px solid rgba(245,241,232,0.1)",
    color: "#F5F1E8",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.875rem",
    borderRadius: "4px",
    outline: "none",
  };

  const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "rgba(245,241,232,0.5)",
    marginBottom: "0.5rem",
  };

  return (
    <div style={{ backgroundColor: "#1A2332", padding: "2rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", maxWidth: "800px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={LABEL_STYLE}>Title</label>
            <input required name="title" value={formData.title} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Slug (Auto if empty)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} style={INPUT_STYLE} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={LABEL_STYLE}>Price (Paise)</label>
            <input required type="number" name="pricePaise" value={formData.pricePaise} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>MRP (Paise)</label>
            <input required type="number" name="mrpPaise" value={formData.mrpPaise} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Category</label>
            <input required name="category" value={formData.category} onChange={handleChange} style={INPUT_STYLE} />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Description</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} style={{ ...INPUT_STYLE, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={LABEL_STYLE}>Main Image URL</label>
            <input required name="image" value={formData.image} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Hover Image URL</label>
            <input name="hoverImage" value={formData.hoverImage} onChange={handleChange} style={INPUT_STYLE} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={LABEL_STYLE}>Sizes (Comma separated)</label>
            <input required name="sizes" value={formData.sizes} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Badge (e.g. NEW, HOT)</label>
            <input name="badge" value={formData.badge} onChange={handleChange} style={INPUT_STYLE} />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
          <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} style={{ width: "20px", height: "20px", accentColor: "#C94227" }} />
          <span style={LABEL_STYLE}>In Stock</span>
        </label>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={loading} style={{ padding: "1rem 2rem", backgroundColor: "#C94227", color: "#F5F1E8", border: "none", borderRadius: "4px", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
