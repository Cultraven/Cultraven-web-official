"use client";
/**
 * Admin CMS — Hero Banners — /admin/cms/hero
 *
 * CRUD for hero slideshow banners.
 * Features:
 *   - List current banners with preview
 *   - Add new banner (image/video, headline, CTA)
 *   - Edit / Reorder / Delete banners
 *   - Save changes → PUT /api/cms/hero
 */
import React, { useState } from "react";

interface HeroBanner {
  id: string;
  type: "image" | "video";
  srcDesktop: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  overlayOpacity: number;
  active: boolean;
}

const INITIAL_BANNERS: HeroBanner[] = [
  {
    id: "h1",
    type: "image",
    srcDesktop: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1400&auto=format&fit=crop&q=85",
    headline: "BUILT FOR THE MOVEMENT",
    subheadline: "260 GSM heavyweight streetwear. Not made to blend in.",
    ctaLabel: "SHOP NEW ARRIVALS",
    ctaHref: "/collections/new-in",
    overlayOpacity: 0.45,
    active: true,
  },
  {
    id: "h2",
    type: "image",
    srcDesktop: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=1400&auto=format&fit=crop&q=85",
    headline: "THE RAVEN COLLECTION",
    subheadline: "Oversized silhouettes. Premium cotton. Zero compromises.",
    ctaLabel: "EXPLORE COLLECTION",
    ctaHref: "/collections/street",
    overlayOpacity: 0.4,
    active: true,
  },
];

const EMPTY_BANNER: Omit<HeroBanner, "id"> = {
  type: "image",
  srcDesktop: "",
  headline: "",
  subheadline: "",
  ctaLabel: "SHOP NOW",
  ctaHref: "/collections/all",
  overlayOpacity: 0.4,
  active: true,
};

export default function AdminCmsHeroPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<HeroBanner, "id">>(EMPTY_BANNER);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/cms/hero")
      .then((res) => res.json())
      .then((data) => {
        const loaded = data.banners || [];
        // If DB has no banners yet, seed with initial templates
        setBanners(loaded.length > 0 ? loaded : INITIAL_BANNERS);
      })
      .catch(() => setBanners(INITIAL_BANNERS))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (banner: HeroBanner) => {
    setEditingId(banner.id);
    const { id: _id, ...rest } = banner;
    setForm(rest);
  };

  const startNew = () => {
    setEditingId("new");
    setForm(EMPTY_BANNER);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_BANNER);
  };

  const saveEdit = () => {
    if (editingId === "new") {
      setBanners((prev) => [...prev, { ...form, id: `h${Date.now()}` }]);
    } else {
      setBanners((prev) => prev.map((b) => (b.id === editingId ? { ...form, id: editingId } : b)));
    }
    setEditingId(null);
    setForm(EMPTY_BANNER);
  };

  const deleteBanner = (id: string) => {
    if (!confirm("Delete this banner?")) return;
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleActive = (id: string) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
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
        setForm((prev) => ({ ...prev, srcDesktop: data.url }));
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch {
      alert("Error uploading file.");
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Save failed: " + (err.error || res.statusText));
      }
    } catch {
      alert("Network error — could not save. Check your connection.");
    }
    setSaving(false);
  };

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

  return (
    <div style={{ padding: "2.5rem 3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.4rem" }}>
            CMS
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>
            Hero Banners
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={startNew}
            style={{ padding: "0.75rem 1.25rem", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add Banner
          </button>
          <button
            id="admin-save-hero-btn"
            onClick={saveAll}
            disabled={saving}
            style={{ padding: "0.75rem 1.5rem", backgroundColor: saved ? "#10B981" : "var(--color-crimson)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: "4px", cursor: saving ? "not-allowed" : "pointer", transition: "background-color 0.2s ease" }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Banners list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            style={{
              backgroundColor: "#1A2332",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem 1.5rem" }}>
              {/* Order */}
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", fontWeight: 900, color: "rgba(245,241,232,0.15)", width: "24px", flexShrink: 0 }}>
                {i + 1}
              </span>

              {/* Preview */}
              <div style={{ width: "120px", height: "68px", flexShrink: 0, position: "relative", borderRadius: "3px", overflow: "hidden", backgroundColor: "#0F1419" }}>
                {banner.srcDesktop && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={banner.srcDesktop} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.88rem", color: "var(--color-cream)", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {banner.headline || "(No headline)"}
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "rgba(245,241,232,0.4)", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {banner.subheadline}
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "rgba(245,241,232,0.3)" }}>
                  CTA: {banner.ctaLabel} → {banner.ctaHref}
                </p>
              </div>

              {/* Status toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  onClick={() => toggleActive(banner.id)}
                  style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    backgroundColor: banner.active ? "#10B981" : "rgba(255,255,255,0.15)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                  }}
                  aria-label={banner.active ? "Deactivate" : "Activate"}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: banner.active ? "18px" : "2px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-cream)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: banner.active ? "#10B981" : "rgba(245,241,232,0.35)", fontWeight: 600 }}>
                  {banner.active ? "Live" : "Hidden"}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  onClick={() => startEdit(banner)}
                  style={{ padding: "6px 14px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.75)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.72rem", border: "none", borderRadius: "3px", cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  style={{ padding: "6px 14px", backgroundColor: "rgba(201,66,39,0.1)", color: "var(--color-crimson)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.72rem", border: "none", borderRadius: "3px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / New form */}
      {editingId && (
        <div
          style={{
            backgroundColor: "#1A2332",
            border: "1px solid rgba(201,66,39,0.3)",
            borderRadius: "6px",
            padding: "2rem",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1rem", color: "var(--color-cream)", marginBottom: "1.75rem" }}>
            {editingId === "new" ? "New Banner" : "Edit Banner"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Type */}
            <div>
              <label style={LABEL}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "image" | "video" }))}
                style={{ ...INPUT, cursor: "pointer", appearance: "none" }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Active */}
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.125rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  style={{ accentColor: "var(--color-crimson)", width: "18px", height: "18px" }}
                />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", fontWeight: 600, color: "rgba(245,241,232,0.75)" }}>
                  Active (show on homepage)
                </span>
              </label>
            </div>

            {/* Image URL / Upload */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Image / Video Upload (Desktop)</label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <input type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ ...INPUT, flex: 1, padding: "0.6rem 1rem" }} />
                <input type="url" value={form.srcDesktop} onChange={(e) => setForm((p) => ({ ...p, srcDesktop: e.target.value }))} placeholder="Or paste URL https://..." style={{ ...INPUT, flex: 2 }} />
              </div>
            </div>

            {/* Headline */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Headline</label>
              <input type="text" value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} placeholder="BUILT FOR THE MOVEMENT" maxLength={80} style={INPUT} />
            </div>

            {/* Subheadline */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Subheadline</label>
              <input type="text" value={form.subheadline} onChange={(e) => setForm((p) => ({ ...p, subheadline: e.target.value }))} placeholder="Short supporting line..." maxLength={120} style={INPUT} />
            </div>

            {/* CTA */}
            <div>
              <label style={LABEL}>CTA Label</label>
              <input type="text" value={form.ctaLabel} onChange={(e) => setForm((p) => ({ ...p, ctaLabel: e.target.value }))} placeholder="SHOP NOW" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>CTA Link</label>
              <input type="text" value={form.ctaHref} onChange={(e) => setForm((p) => ({ ...p, ctaHref: e.target.value }))} placeholder="/collections/all" style={INPUT} />
            </div>

            {/* Overlay */}
            <div>
              <label style={LABEL}>Overlay Opacity ({Math.round(form.overlayOpacity * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={form.overlayOpacity}
                onChange={(e) => setForm((p) => ({ ...p, overlayOpacity: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "var(--color-crimson)" }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.75rem" }}>
            <button
              onClick={saveEdit}
              style={{ padding: "0.75rem 1.75rem", backgroundColor: "var(--color-crimson)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {editingId === "new" ? "Add Banner" : "Save Changes"}
            </button>
            <button
              onClick={cancelEdit}
              style={{ padding: "0.75rem 1.5rem", backgroundColor: "transparent", color: "rgba(245,241,232,0.55)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
