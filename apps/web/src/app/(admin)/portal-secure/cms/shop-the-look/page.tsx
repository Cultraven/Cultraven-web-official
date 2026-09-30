"use client";
import React, { useState, useEffect } from "react";
import { MediaUploadButton } from "@/components/admin/MediaUploadButton";

interface LookProduct {
  id: string;
  title: string;
  category: string;
  href: string;
  image: string;
  pricePaise: number;
  color: string;
}

interface ShopLook {
  lookLabel: string;
  modelImage: string;
  products: LookProduct[];
}

const EMPTY_PRODUCT: LookProduct = { id: "", title: "", category: "", href: "", image: "", pricePaise: 0, color: "" };

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "#0F1419",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "4px",
  fontFamily: "var(--font-sans)",
  fontSize: "0.82rem",
  color: "var(--color-cream)",
  outline: "none",
};
const LABEL: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(245,241,232,0.45)",
  marginBottom: "0.4rem",
};

export default function AdminShopTheLookPage() {
  const [look, setLook] = useState<ShopLook>({ lookLabel: "LOOK 01", modelImage: "", products: [] });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<LookProduct>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasRecord, setHasRecord] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);

  // The saved database record is the only source. No record → intentional empty state.
  useEffect(() => {
    fetch("/api/cms/shop-the-look", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "HTTP " + r.status);
        if (d.look) { setLook(d.look); setHasRecord(true); }
      })
      .catch((e) => setLoadError(e.message || "Could not load"))
      .finally(() => setLoading(false));
  }, []);

  const moveProduct = (i: number, dir: -1 | 1) => setLook((prev) => {
    const j = i + dir;
    if (j < 0 || j >= prev.products.length) return prev;
    const products = [...prev.products];
    [products[i], products[j]] = [products[j], products[i]];
    return { ...prev, products };
  });

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setProductForm(look.products[idx] ? { ...look.products[idx] } : EMPTY_PRODUCT);
  };
  const startNew = () => {
    setEditingIdx(-1);
    setProductForm({ ...EMPTY_PRODUCT, id: `l${Date.now()}` });
  };
  const cancelEdit = () => { setEditingIdx(null); setProductForm(EMPTY_PRODUCT); };

  const saveProduct = () => {
    if (editingIdx === -1) {
      setLook((prev) => ({ ...prev, products: [...prev.products, productForm] }));
    } else if (editingIdx !== null) {
      setLook((prev) => {
        const updated = [...prev.products];
        updated[editingIdx] = productForm;
        return { ...prev, products: updated };
      });
    }
    setEditingIdx(null);
    setProductForm(EMPTY_PRODUCT);
  };

  const deleteProduct = (idx: number) => {
    if (!confirm("Remove this product from the look?")) return;
    setLook((prev) => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }));
  };

  const saveAll = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/cms/shop-the-look", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ look }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        if (d.look) setLook(d.look); // show exactly what the database now holds
        setHasRecord(true);
        setSaved(true);
        setStatus({ kind: "ok", msg: "Saved to the database. The website now shows this look." });
        setTimeout(() => setSaved(false), 3000);
      } else setStatus({ kind: "error", msg: d.error || "Save failed" });
    } catch { setStatus({ kind: "error", msg: "Network error — nothing was saved." }); }
    setSaving(false);
  };

  const fmt = (p: number) => p ? `₹${(p / 100).toLocaleString("en-IN")}` : "—";

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.4rem" }}>CMS</p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>Shop The Look</h1>
        </div>
        <button onClick={saveAll} disabled={saving || !!loadError} style={{ opacity: loadError ? 0.5 : 1, padding: "0.75rem 1.5rem", backgroundColor: saved ? "#10B981" : "var(--color-crimson)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>

      {loadError && (
        <div role="alert" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "#FCA5A5", fontSize: "0.82rem" }}>
          Could not load the saved look ({loadError}). Saving is disabled so the live data can&apos;t be overwritten. Reload to retry.
        </div>
      )}
      {status && (
        <div role="status" style={{ padding: "0.85rem 1.25rem", marginBottom: "1.5rem", borderRadius: 6, fontSize: "0.82rem", backgroundColor: status.kind === "ok" ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)", border: "1px solid " + (status.kind === "ok" ? "rgba(16,185,129,0.4)" : "rgba(248,113,113,0.4)"), color: status.kind === "ok" ? "#6EE7B7" : "#FCA5A5" }}>{status.msg}</div>
      )}
      {loading ? (
        <p style={{ color: "rgba(245,241,232,0.4)", fontFamily: "var(--font-sans)" }}>Loading...</p>
      ) : (
        <>
          {!hasRecord && !loadError && (
            <p style={{ color: "rgba(245,241,232,0.5)", fontSize: "0.82rem", marginBottom: "1.25rem" }}>No look configured yet — the section is hidden on the website. Fill this in and save to create it.</p>
          )}
          {/* Look settings */}
          <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "1.75rem", marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-cream)", marginBottom: "1.25rem" }}>Look Settings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.25rem" }}>
              <div>
                <label style={LABEL}>Look Label</label>
                <input type="text" value={look.lookLabel} onChange={(e) => setLook((p) => ({ ...p, lookLabel: e.target.value }))} placeholder="LOOK 01" style={INPUT} />
              </div>
              <div>
                <label style={LABEL}>Model Image URL</label>
                <div style={{ display: "flex", gap: 8 }}><input type="url" value={look.modelImage} onChange={(e) => setLook((p) => ({ ...p, modelImage: e.target.value }))} placeholder="https://… or upload" style={INPUT} /><MediaUploadButton hasValue={!!look.modelImage} onUploaded={(u) => setLook((p) => ({ ...p, modelImage: u }))} onError={(m) => setStatus({ kind: "error", msg: m })} /></div>
              </div>
            </div>
            {look.modelImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={look.modelImage} alt="Preview" style={{ marginTop: "1rem", height: "120px", objectFit: "cover", borderRadius: "4px" }} />
            )}
          </div>

          {/* Products list */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-cream)" }}>Products in This Look ({look.products.length})</h2>
              <button onClick={startNew} style={{ padding: "0.6rem 1.1rem", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", cursor: "pointer" }}>
                + Add Product
              </button>
            </div>

            {look.products.length === 0 && (
              <p style={{ color: "rgba(245,241,232,0.3)", fontFamily: "var(--font-sans)", fontSize: "0.82rem" }}>No products added yet.</p>
            )}

            {look.products.map((p, i) => (
              <div key={p.id || i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", marginBottom: "0.75rem" }}>
                {p.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.image} alt="" style={{ width: "60px", height: "75px", objectFit: "cover", borderRadius: "3px", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-cream)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title || "(No title)"}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "rgba(245,241,232,0.4)" }}>{p.category} · {p.color} · {fmt(p.pricePaise)}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "rgba(245,241,232,0.25)" }}>{p.href}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button onClick={() => moveProduct(i, -1)} disabled={i === 0} aria-label="Move up" style={{ padding: "6px 10px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", border: "none", borderRadius: "3px", cursor: "pointer", opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                  <button onClick={() => moveProduct(i, 1)} disabled={i === look.products.length - 1} aria-label="Move down" style={{ padding: "6px 10px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", border: "none", borderRadius: "3px", cursor: "pointer", opacity: i === look.products.length - 1 ? 0.3 : 1 }}>▼</button>
                  <button onClick={() => startEdit(i)} style={{ padding: "6px 14px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.72rem", border: "none", borderRadius: "3px", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => deleteProduct(i)} style={{ padding: "6px 14px", backgroundColor: "rgba(201,66,39,0.1)", color: "var(--color-crimson)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.72rem", border: "none", borderRadius: "3px", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit product form */}
          {editingIdx !== null && (
            <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(201,66,39,0.3)", borderRadius: "6px", padding: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1rem", color: "var(--color-cream)", marginBottom: "1.75rem" }}>
                {editingIdx === -1 ? "Add Product" : "Edit Product"}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={LABEL}>Product Title</label>
                  <input type="text" value={productForm.title} onChange={(e) => setProductForm((p) => ({ ...p, title: e.target.value }))} placeholder="RAVEN OVERSIZED TEE — ACID BLACK" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Category (display)</label>
                  <input type="text" value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} placeholder="T-SHIRT" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Color</label>
                  <input type="text" value={productForm.color} onChange={(e) => setProductForm((p) => ({ ...p, color: e.target.value }))} placeholder="Acid Black" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Price (paise)</label>
                  <input type="number" value={productForm.pricePaise || ""} onChange={(e) => setProductForm((p) => ({ ...p, pricePaise: parseInt(e.target.value) || 0 }))} placeholder="199900" style={INPUT} />
                </div>
                <div>
                  <label style={LABEL}>Product URL</label>
                  <input type="text" value={productForm.href} onChange={(e) => setProductForm((p) => ({ ...p, href: e.target.value }))} placeholder="/products/slug" style={INPUT} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={LABEL}>Thumbnail Image URL</label>
                  <div style={{ display: "flex", gap: 8 }}><input type="url" value={productForm.image} onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://… or upload" style={INPUT} /><MediaUploadButton hasValue={!!productForm.image} onUploaded={(u) => setProductForm((p) => ({ ...p, image: u }))} onError={(m) => setStatus({ kind: "error", msg: m })} /></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button onClick={saveProduct} style={{ padding: "0.75rem 1.75rem", backgroundColor: "var(--color-crimson)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  {editingIdx === -1 ? "Add Product" : "Save Changes"}
                </button>
                <button onClick={cancelEdit} style={{ padding: "0.75rem 1.5rem", backgroundColor: "transparent", color: "rgba(245,241,232,0.55)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
