"use client";
/**
 * Admin CMS — Hero media — /portal-secure/cms/hero
 *
 * Media type: Image (single) · Video · Slideshow (multiple slides).
 * Each slide has independent desktop / mobile media, poster (video), alt text,
 * focal position, overlay, duration, schedule, order and active state.
 * Save → PUT /api/cms/hero (validated server-side; existing data is never wiped on failure).
 */
import React, { useEffect, useRef, useState } from "react";

type Mode = "image" | "video" | "slideshow";
type MediaKind = "image" | "video";

interface Slide {
  id: string;
  type: MediaKind;
  srcDesktop: string;
  srcMobile: string;
  posterSrc: string;
  altText: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  objectPosition: string;
  overlayOpacity: number;
  durationMs: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

const EMPTY_SLIDE: Omit<Slide, "id"> = {
  type: "image",
  srcDesktop: "",
  srcMobile: "",
  posterSrc: "",
  altText: "",
  eyebrow: "",
  headline: "",
  subheadline: "",
  ctaLabel: "SHOP NOW",
  ctaHref: "/collections/all",
  objectPosition: "center center",
  overlayOpacity: 0.4,
  durationMs: 5000,
  startsAt: null,
  endsAt: null,
  active: true,
};

const POSITIONS = ["left top", "center top", "right top", "left center", "center center", "right center", "left bottom", "center bottom", "right bottom"];
const isVideoUrl = (u: string) => /\.(mp4|webm)(\?.*)?$/i.test(u);
const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.9rem",
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
  color: "rgba(245,241,232,0.5)",
  marginBottom: "0.4rem",
};
const BTN: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "rgba(255,255,255,0.06)",
  color: "rgba(245,241,232,0.8)",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: "0.72rem",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
};

function Preview({ src, kind, poster, height = 68, width = 120 }: { src: string; kind: MediaKind; poster?: string; height?: number; width?: number }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const box: React.CSSProperties = { width, height, flexShrink: 0, borderRadius: 3, overflow: "hidden", backgroundColor: "#0F1419", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,241,232,0.3)", fontSize: "0.6rem", textAlign: "center" };
  if (!src) return <div style={box}>No media</div>;
  if (broken) return <div style={{ ...box, color: "#F87171" }}>Broken URL</div>;
  if (kind === "video" || isVideoUrl(src)) {
    return (
      <div style={box}>
        <video src={src} poster={poster || undefined} muted playsInline preload="metadata" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

/** URL field + upload button + live preview + remove. */
function MediaField({
  label,
  hint,
  value,
  kind,
  poster,
  onChange,
  onError,
}: {
  label: string;
  hint?: string;
  value: string;
  kind: MediaKind;
  poster?: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        if (kind === "image" && data.kind === "video") onError(`${label}: a video was uploaded where an image is expected`);
        else onChange(data.url);
      } else {
        onError(`${label}: ${data.error || "upload failed"}`);
      }
    } catch {
      onError(`${label}: network error during upload`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <Preview src={value} kind={kind} poster={poster} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" style={INPUT} />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              ref={fileRef}
              type="file"
              accept={kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif,image/gif"}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              style={{ display: "none" }}
            />
            <button type="button" style={BTN} disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
            </button>
            {value && (
              <button type="button" style={{ ...BTN, color: "#F87171" }} onClick={() => onChange("")}>
                Remove
              </button>
            )}
            {hint && <span style={{ fontSize: "0.65rem", color: "rgba(245,241,232,0.35)" }}>{hint}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCmsHeroPage() {
  const [mode, setMode] = useState<Mode>("slideshow");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Slide, "id">>(EMPTY_SLIDE);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/cms/hero", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setMode(data.mode || "slideshow");
        setSlides(data.banners || []);
      })
      .catch((e) => setLoadError(e.message || "Could not load hero settings"))
      .finally(() => setLoading(false));
  }, []);

  const forcedType: MediaKind | null = mode === "image" ? "image" : mode === "video" ? "video" : null;

  const changeSlides = (fn: (prev: Slide[]) => Slide[]) => {
    setSlides(fn);
    setDirty(true);
    setStatus(null);
  };

  const startNew = () => {
    setEditingId("new");
    setFormErrors([]);
    setForm({ ...EMPTY_SLIDE, type: forcedType ?? "image" });
  };
  const startEdit = (s: Slide) => {
    const { id: _id, ...rest } = s;
    setEditingId(s.id);
    setFormErrors([]);
    setForm(rest);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setFormErrors([]);
  };

  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!form.srcDesktop) errs.push(`Desktop ${form.type} is required`);
    if (form.type === "video" && form.srcDesktop && !isVideoUrl(form.srcDesktop)) errs.push("Desktop video must be an .mp4 or .webm file");
    if (form.type === "video" && form.srcMobile && !isVideoUrl(form.srcMobile)) errs.push("Mobile video must be an .mp4 or .webm file");
    if (form.type === "video" && !form.posterSrc) errs.push("A poster/fallback image is required for video slides");
    if (!/^(\/(?!\/)|https:\/\/)/.test(form.ctaHref)) errs.push('CTA link must start with "/" or https://');
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) errs.push("End date must be after start date");
    return errs;
  };

  const applyForm = () => {
    const errs = validateForm();
    if (errs.length) {
      setFormErrors(errs);
      return;
    }
    if (editingId === "new") changeSlides((p) => [...p, { ...form, id: `new-${Date.now()}` }]);
    else changeSlides((p) => p.map((s) => (s.id === editingId ? { ...form, id: s.id } : s)));
    setEditingId(null);
    setFormErrors([]);
  };

  const move = (i: number, dir: -1 | 1) =>
    changeSlides((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const saveAll = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/cms/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, banners: slides }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSlides(data.banners || []);
        setMode(data.mode || mode);
        setDirty(false);
        setStatus({ kind: "ok", msg: "Saved. The homepage now shows this hero." });
      } else {
        setStatus({ kind: "error", msg: data.error || `Save failed (HTTP ${res.status})` });
      }
    } catch {
      setStatus({ kind: "error", msg: "Network error — nothing was saved." });
    }
    setSaving(false);
  };

  const modeCard = (value: Mode, title: string, desc: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(value);
        setDirty(true);
        setStatus(null);
      }}
      style={{
        flex: 1,
        textAlign: "left",
        padding: "1rem 1.25rem",
        borderRadius: 6,
        cursor: "pointer",
        backgroundColor: mode === value ? "rgba(218,178,5,0.12)" : "#1A2332",
        border: `1px solid ${mode === value ? "var(--color-lava)" : "rgba(255,255,255,0.08)"}`,
        color: "var(--color-cream)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: "0.7rem", color: "rgba(245,241,232,0.5)", lineHeight: 1.4 }}>{desc}</div>
    </button>
  );

  const visibleHint =
    mode === "slideshow"
      ? "All active slides play in order."
      : `Only the first active ${mode} slide is shown on the homepage.`;

  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: "0.4rem" }}>
            Content / Media · Homepage
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>Hero</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {dirty && <span style={{ fontSize: "0.72rem", color: "#FBBF24" }}>Unsaved changes</span>}
          <button type="button" onClick={startNew} disabled={!!loadError} style={{ ...BTN, padding: "0.75rem 1.25rem", fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            + Add slide
          </button>
          <button
            id="admin-save-hero-btn"
            type="button"
            onClick={saveAll}
            disabled={saving || !!loadError || slides.length === 0}
            style={{ padding: "0.75rem 1.5rem", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: 4, cursor: saving || loadError ? "not-allowed" : "pointer", opacity: saving || loadError || slides.length === 0 ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save hero"}
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "#FCA5A5", fontSize: "0.82rem" }}>
          Could not load the current hero ({loadError}). Editing is disabled so the live hero can&apos;t be overwritten. Reload to retry.
        </div>
      )}
      {status && (
        <div role="status" style={{ padding: "0.85rem 1.25rem", marginBottom: "1.5rem", borderRadius: 6, fontSize: "0.82rem", backgroundColor: status.kind === "ok" ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${status.kind === "ok" ? "rgba(16,185,129,0.4)" : "rgba(248,113,113,0.4)"}`, color: status.kind === "ok" ? "#6EE7B7" : "#FCA5A5" }}>
          {status.msg}
        </div>
      )}

      {/* Media type */}
      <p style={LABEL}>Media type</p>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        {modeCard("image", "Image", "One hero image (desktop + mobile).")}
        {modeCard("video", "Video", "Muted looping video with a poster fallback.")}
        {modeCard("slideshow", "Slideshow", "Multiple slides, each image or video.")}
      </div>
      <p style={{ fontSize: "0.7rem", color: "rgba(245,241,232,0.4)", marginBottom: "1.75rem" }}>{visibleHint}</p>

      {/* Slide list */}
      {loading ? (
        <p style={{ color: "rgba(245,241,232,0.5)", fontSize: "0.85rem" }}>Loading…</p>
      ) : slides.length === 0 && !loadError ? (
        <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 6, color: "rgba(245,241,232,0.5)", fontSize: "0.85rem", marginBottom: "2rem" }}>
          No hero slides yet — the storefront is showing its built-in default. Add a slide to take over.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          {slides.map((s, i) => (
            <div key={s.id} style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", opacity: s.active ? 1 : 0.55 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} style={{ ...BTN, padding: "2px 8px", opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                <button type="button" aria-label="Move down" disabled={i === slides.length - 1} onClick={() => move(i, 1)} style={{ ...BTN, padding: "2px 8px", opacity: i === slides.length - 1 ? 0.3 : 1 }}>▼</button>
              </div>
              <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "rgba(245,241,232,0.2)", width: 22 }}>{i + 1}</span>
              <Preview src={s.srcDesktop} kind={s.type} poster={s.posterSrc} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--color-cream)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.headline || "(No headline)"}
                </p>
                <p style={{ fontSize: "0.68rem", color: "rgba(245,241,232,0.4)" }}>
                  {s.type === "video" ? "Video" : "Image"} · {s.srcMobile ? "desktop + mobile" : "desktop only"} · {(s.durationMs / 1000).toFixed(0)}s · CTA {s.ctaLabel} → {s.ctaHref}
                  {(s.startsAt || s.endsAt) && " · scheduled"}
                </p>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.68rem", color: s.active ? "#10B981" : "rgba(245,241,232,0.4)", fontWeight: 600 }}>
                <input type="checkbox" checked={s.active} onChange={() => changeSlides((p) => p.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)))} />
                {s.active ? "Live" : "Hidden"}
              </label>
              <button type="button" style={BTN} onClick={() => startEdit(s)}>Edit</button>
              <button
                type="button"
                style={{ ...BTN, color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}
                onClick={() => confirm("Delete this slide? This takes effect after you click Save hero.") && changeSlides((p) => p.filter((x) => x.id !== s.id))}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {editingId && (
        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(218,178,5,0.35)", borderRadius: 6, padding: "2rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-cream)", marginBottom: "1.5rem" }}>
            {editingId === "new" ? "New slide" : "Edit slide"}
          </h2>

          {formErrors.length > 0 && (
            <ul role="alert" style={{ margin: "0 0 1.25rem", padding: "0.85rem 1.25rem 0.85rem 2rem", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "#FCA5A5", fontSize: "0.78rem" }}>
              {formErrors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={LABEL}>Slide media</label>
              <select
                value={forcedType ?? form.type}
                disabled={!!forcedType}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as MediaKind }))}
                style={{ ...INPUT, cursor: forcedType ? "not-allowed" : "pointer" }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "flex-end", gap: 10, cursor: "pointer", paddingBottom: 6 }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(245,241,232,0.8)" }}>Active (show on homepage)</span>
            </label>

            <div style={{ gridColumn: "1/-1" }}>
              <MediaField label={`Desktop ${form.type}`} hint={form.type === "video" ? "MP4/WebM, max 40MB" : "JPG/PNG/WebP/AVIF, max 10MB"} value={form.srcDesktop} kind={form.type} poster={form.posterSrc} onChange={(u) => setForm((p) => ({ ...p, srcDesktop: u }))} onError={(m) => setFormErrors([m])} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <MediaField label={`Mobile ${form.type} (optional)`} hint="Falls back to desktop if empty" value={form.srcMobile} kind={form.type} poster={form.posterSrc} onChange={(u) => setForm((p) => ({ ...p, srcMobile: u }))} onError={(m) => setFormErrors([m])} />
            </div>
            {form.type === "video" && (
              <div style={{ gridColumn: "1/-1" }}>
                <MediaField label="Poster / fallback image (required)" hint="Shown while loading and if the video fails" value={form.posterSrc} kind="image" onChange={(u) => setForm((p) => ({ ...p, posterSrc: u }))} onError={(m) => setFormErrors([m])} />
              </div>
            )}

            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Alt text (describe the media for screen readers)</label>
              <input type="text" value={form.altText} maxLength={200} onChange={(e) => setForm((p) => ({ ...p, altText: e.target.value }))} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Eyebrow (small label above headline)</label>
              <input type="text" value={form.eyebrow} maxLength={60} placeholder="Dharma Series EP 01" onChange={(e) => setForm((p) => ({ ...p, eyebrow: e.target.value }))} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Headline</label>
              <input type="text" value={form.headline} maxLength={120} placeholder="WEAR YOUR DIFFERENCE." onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} style={INPUT} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Subtitle</label>
              <input type="text" value={form.subheadline} maxLength={200} onChange={(e) => setForm((p) => ({ ...p, subheadline: e.target.value }))} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>CTA text</label>
              <input type="text" value={form.ctaLabel} maxLength={40} onChange={(e) => setForm((p) => ({ ...p, ctaLabel: e.target.value }))} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>CTA URL</label>
              <input type="text" value={form.ctaHref} maxLength={512} placeholder="/collections/all" onChange={(e) => setForm((p) => ({ ...p, ctaHref: e.target.value }))} style={INPUT} />
            </div>

            <div>
              <label style={LABEL}>Focal position (how the media is cropped)</label>
              <select value={form.objectPosition} onChange={(e) => setForm((p) => ({ ...p, objectPosition: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Overlay darkness ({Math.round(form.overlayOpacity * 100)}%)</label>
              <input type="range" min="0" max="0.8" step="0.05" value={form.overlayOpacity} onChange={(e) => setForm((p) => ({ ...p, overlayOpacity: parseFloat(e.target.value) }))} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={LABEL}>Duration on screen ({Math.round(form.durationMs / 1000)}s, slideshow)</label>
              <input type="range" min="2000" max="20000" step="1000" value={form.durationMs} onChange={(e) => setForm((p) => ({ ...p, durationMs: parseInt(e.target.value, 10) }))} style={{ width: "100%" }} />
            </div>
            <div />
            <div>
              <label style={LABEL}>Show from (optional)</label>
              <input type="datetime-local" value={toLocalInput(form.startsAt)} onChange={(e) => setForm((p) => ({ ...p, startsAt: fromLocalInput(e.target.value) }))} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Hide after (optional)</label>
              <input type="datetime-local" value={toLocalInput(form.endsAt)} onChange={(e) => setForm((p) => ({ ...p, endsAt: fromLocalInput(e.target.value) }))} style={INPUT} />
            </div>
          </div>

          {/* Live slide preview */}
          {form.srcDesktop && (
            <div style={{ marginTop: "1.5rem" }}>
              <p style={LABEL}>Preview</p>
              <div style={{ position: "relative", aspectRatio: "16/7", overflow: "hidden", borderRadius: 4, backgroundColor: "var(--color-navy)" }}>
                {form.type === "video" && isVideoUrl(form.srcDesktop) ? (
                  <video src={form.srcDesktop} poster={form.posterSrc || undefined} muted loop playsInline autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: form.objectPosition }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.srcDesktop} alt={form.altText} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: form.objectPosition }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(23,37,84,${form.overlayOpacity}), transparent 60%)` }} />
                <div style={{ position: "absolute", left: "5%", bottom: "8%", color: "#fff" }}>
                  {form.eyebrow && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: "var(--color-lava)", textTransform: "uppercase" }}>{form.eyebrow}</div>}
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.2rem,3vw,2.2rem)", textTransform: "uppercase", lineHeight: 1 }}>{form.headline}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.75rem" }}>
            <button type="button" onClick={applyForm} style={{ padding: "0.75rem 1.75rem", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: 4, cursor: "pointer" }}>
              {editingId === "new" ? "Add slide" : "Apply changes"}
            </button>
            <button type="button" onClick={cancelEdit} style={{ ...BTN, padding: "0.75rem 1.5rem", fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.1)" }}>
              Cancel
            </button>
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.68rem", color: "rgba(245,241,232,0.4)" }}>
            &ldquo;Apply&rdquo; updates the list above. Click <strong>Save hero</strong> at the top to publish to the website.
          </p>
        </div>
      )}
    </div>
  );
}
