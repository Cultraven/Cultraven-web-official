"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploadButton } from "./MediaUploadButton";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.875rem",
  backgroundColor: "#0F1419",
  border: "1px solid rgba(245,241,232,0.1)",
  color: "var(--color-cream)",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  borderRadius: "4px",
  outline: "none",
};
const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(245,241,232,0.5)",
  marginBottom: "0.5rem",
};
const SMALL_BTN: React.CSSProperties = { padding: "6px 10px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.8)", fontWeight: 600, fontSize: "0.72rem", border: "none", borderRadius: 3, cursor: "pointer" };

const colorsToText = (colors: { hex: string; label: string }[] | undefined) =>
  (colors ?? []).map((c) => `${c.label}:${c.hex}`).join(", ");
const textToColors = (text: string) =>
  text
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [label, hex] = p.split(":").map((x) => x.trim());
      return { label: label ?? "", hex: hex ?? "" };
    });

export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>(Array.isArray(initialData?.images) ? initialData.images : []);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    pricePaise: initialData?.pricePaise || 0,
    mrpPaise: initialData?.mrpPaise || 0,
    description: initialData?.description || "",
    category: initialData?.category || "tees",
    fit: initialData?.fit || "oversized",
    image: initialData?.image || "",
    hoverImage: initialData?.hoverImage || "",
    inStock: initialData ? initialData.inStock !== false : true,
    sizes: initialData?.sizes?.join(", ") || "S, M, L, XL",
    colors: colorsToText(initialData?.colors),
    badge: initialData?.badge || "",
    isNewArrival: initialData?.isNewArrival === true,
    isBestseller: initialData?.isBestseller === true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const moveGallery = (i: number, d: -1 | 1) =>
    setGallery((g) => {
      const j = i + d;
      if (j < 0 || j >= g.length) return g;
      const c = [...g];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title: formData.title,
      slug: formData.slug || undefined,
      description: formData.description,
      category: formData.category,
      fit: formData.fit,
      image: formData.image,
      hoverImage: formData.hoverImage || undefined,
      images: gallery.filter(Boolean),
      pricePaise: parseInt(String(formData.pricePaise), 10),
      mrpPaise: parseInt(String(formData.mrpPaise), 10),
      sizes: formData.sizes.split(",").map((s: string) => s.trim()).filter(Boolean),
      colors: textToColors(formData.colors),
      badge: formData.badge || null,
      inStock: formData.inStock,
      isNewArrival: formData.isNewArrival,
      isBestseller: formData.isBestseller,
    };

    try {
      const url = initialData ? `/api/products/${initialData._id}` : "/api/products";
      const res = await fetch(url, { method: initialData ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        router.push("/portal-secure/products");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        const detail = err.issues ?? err.error;
        setError(typeof detail === "string" ? detail : JSON.stringify(detail) || "Save failed");
      }
    } catch {
      setError("Network error — nothing was saved.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#1A2332", padding: "2rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", maxWidth: "800px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {error && (
          <div role="alert" style={{ padding: "0.85rem 1.1rem", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "#FCA5A5", fontSize: "0.82rem", wordBreak: "break-word" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={LABEL_STYLE}>Title</label>
            <input required name="title" value={formData.title} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Slug (a-z, 0-9, dashes)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} required={!initialData} style={INPUT_STYLE} />
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
            <label style={LABEL_STYLE}>Main Image</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input required name="image" value={formData.image} onChange={handleChange} placeholder="https://… or upload" style={INPUT_STYLE} />
              <MediaUploadButton hasValue={!!formData.image} onUploaded={(u) => setFormData((p) => ({ ...p, image: u }))} onError={setError} />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Hover Image</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="hoverImage" value={formData.hoverImage} onChange={handleChange} placeholder="https://… or upload" style={INPUT_STYLE} />
              <MediaUploadButton hasValue={!!formData.hoverImage} onUploaded={(u) => setFormData((p) => ({ ...p, hoverImage: u }))} onError={setError} />
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div>
          <label style={LABEL_STYLE}>Product gallery (shown on the product page, in this order)</label>
          <p style={{ fontSize: "0.72rem", color: "rgba(245,241,232,0.4)", margin: "0 0 0.6rem" }}>Leave empty to use the main + hover image.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gallery.map((url, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: 44, height: 55, objectFit: "cover", borderRadius: 3, backgroundColor: "#0F1419", flexShrink: 0 }} />
                <input value={url} onChange={(e) => setGallery((g) => g.map((x, k) => (k === i ? e.target.value : x)))} style={INPUT_STYLE} />
                <button type="button" aria-label="Move up" onClick={() => moveGallery(i, -1)} disabled={i === 0} style={{ ...SMALL_BTN, opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                <button type="button" aria-label="Move down" onClick={() => moveGallery(i, 1)} disabled={i === gallery.length - 1} style={{ ...SMALL_BTN, opacity: i === gallery.length - 1 ? 0.3 : 1 }}>▼</button>
                <button type="button" onClick={() => setGallery((g) => g.filter((_, k) => k !== i))} style={{ ...SMALL_BTN, color: "#F87171" }}>Remove</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <MediaUploadButton onUploaded={(u) => setGallery((g) => [...g, u])} onError={setError} />
            <button type="button" style={SMALL_BTN} onClick={() => setGallery((g) => [...g, ""])}>+ Add URL</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={LABEL_STYLE}>Sizes (comma separated)</label>
            <input required name="sizes" value={formData.sizes} onChange={handleChange} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Colors (Name:#hex, comma separated)</label>
            <input name="colors" value={formData.colors} onChange={handleChange} placeholder="Black:#0A0A0A, Olive:#556B2F" style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Fit</label>
            <select name="fit" value={formData.fit} onChange={handleChange} style={INPUT_STYLE}>
              {["oversized", "relaxed", "boxy", "baggy", "regular"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>Badge (e.g. LIMITED, LOW STOCK)</label>
            <input name="badge" value={formData.badge} onChange={handleChange} style={INPUT_STYLE} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {([
            ["inStock", "In stock"],
            ["isNewArrival", "New arrival (shows in the homepage New Drop)"],
            ["isBestseller", "Bestseller (shows in the homepage Bestsellers)"],
          ] as const).map(([name, label]) => (
            <label key={name} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
              <input type="checkbox" name={name} checked={(formData as any)[name]} onChange={handleChange} style={{ width: "18px", height: "18px" }} />
              <span style={{ ...LABEL_STYLE, margin: 0 }}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={loading} style={{ padding: "1rem 2rem", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", border: "none", borderRadius: "4px", fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
