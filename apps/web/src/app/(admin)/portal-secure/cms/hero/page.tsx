"use client";
/**
 * Admin · Hero — /portal-secure/cms/hero
 * Media type: Image · Video · Slideshow. Each slide has independent desktop / mobile media, poster,
 * alt text, focal position, overlay, duration, schedule, order and visibility.
 * Load = saved database records; Save = PUT /api/cms/hero (validated server-side, non-destructive).
 */
import React, { useEffect, useState } from "react";
import { MediaUploadButton } from "@/components/admin/MediaUploadButton";
import { Alert, Button, Card, EmptyState, Field, Icon, LinkButton, PageHeader, Skeleton, Switch, useConfirm, useToast } from "@/components/admin/ui";

type Mode = "image" | "video" | "slideshow";
type Kind = "image" | "video";

interface Slide {
  id: string; type: Kind; srcDesktop: string; srcMobile: string; posterSrc: string; altText: string; eyebrow: string;
  headline: string; subheadline: string; ctaLabel: string; ctaHref: string; objectPosition: string; overlayOpacity: number;
  durationMs: number; startsAt: string | null; endsAt: string | null; active: boolean;
}

const EMPTY: Omit<Slide, "id"> = {
  type: "image", srcDesktop: "", srcMobile: "", posterSrc: "", altText: "", eyebrow: "", headline: "", subheadline: "",
  ctaLabel: "SHOP NOW", ctaHref: "/collections/all", objectPosition: "center center", overlayOpacity: 0.4, durationMs: 5000,
  startsAt: null, endsAt: null, active: true,
};
const POSITIONS = ["left top", "center top", "right top", "left center", "center center", "right center", "left bottom", "center bottom", "right bottom"];
const isVideoUrl = (u: string) => /\.(mp4|webm)(\?.*)?$/i.test(u);
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

function Media({ src, kind, poster, big }: { src: string; kind: Kind; poster?: string; big?: boolean }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const style = big ? { width: 120, height: 76 } : undefined;
  if (!src) return <div className="adm-media" style={style}>No media</div>;
  if (broken) return <div className="adm-media" style={{ ...style, color: "var(--a-danger)" }}>Broken URL</div>;
  return (
    <div className="adm-media" style={style}>
      {kind === "video" || isVideoUrl(src) ? <video src={src} poster={poster || undefined} muted playsInline preload="metadata" onError={() => setBroken(true)} /> :
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />}
    </div>
  );
}

function MediaField({ label, hint, value, kind, poster, onChange, onError }: { label: string; hint?: string; value: string; kind: Kind; poster?: string; onChange: (u: string) => void; onError: (m: string) => void }) {
  return (
    <Field label={label} hint={hint} span>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Media src={value} kind={kind} poster={poster} big />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <input className="adm-input" type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" />
          <div className="adm-actions">
            <MediaUploadButton kind={kind} hasValue={!!value} onUploaded={onChange} onError={(m) => onError(`${label}: ${m}`)} />
            {value ? <Button size="sm" variant="danger" onClick={() => onChange("")}>Remove</Button> : null}
          </div>
        </div>
      </div>
    </Field>
  );
}

export default function AdminCmsHeroPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [mode, setMode] = useState<Mode>("slideshow");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Slide, "id">>(EMPTY);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const forced: Kind | null = mode === "image" ? "image" : mode === "video" ? "video" : null;
  const change = (fn: (p: Slide[]) => Slide[]) => { setSlides(fn); setDirty(true); setSaveError(null); };
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const startNew = () => { setEditingId("new"); setFormErrors([]); setForm({ ...EMPTY, type: forced ?? "image" }); };
  const startEdit = (s: Slide) => { const { id: _i, ...rest } = s; setEditingId(s.id); setFormErrors([]); setForm(rest); };

  const validate = (): string[] => {
    const e: string[] = [];
    if (!form.srcDesktop) e.push(`Hero ${form.type} is required`);
    if (form.type === "video" && form.srcDesktop && !isVideoUrl(form.srcDesktop)) e.push("Hero video must be an .mp4 or .webm file");
    if (form.type === "video" && !form.posterSrc) e.push("A poster / fallback image is required for video slides");
    if (!/^(\/(?!\/)|https:\/\/)/.test(form.ctaHref)) e.push('Button link must start with "/" or https://');
    if (form.startsAt && form.endsAt && form.startsAt >= form.endsAt) e.push("End date must be after the start date");
    return e;
  };

  const apply = () => {
    const errs = validate();
    if (errs.length) { setFormErrors(errs); return; }
    if (editingId === "new") change((p) => [...p, { ...form, id: `new-${Date.now()}` }]);
    else change((p) => p.map((s) => (s.id === editingId ? { ...form, id: s.id } : s)));
    setEditingId(null);
  };

  const move = (i: number, d: -1 | 1) => change((p) => { const j = i + d; if (j < 0 || j >= p.length) return p; const c = [...p]; [c[i], c[j]] = [c[j], c[i]]; return c; });

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/cms/hero", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, banners: slides }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setSlides(data.banners || []); setMode(data.mode || mode); setDirty(false); toast("Hero saved — the homepage is updated"); }
      else setSaveError(data.error || `Save failed (HTTP ${res.status})`);
    } catch { setSaveError("Network error — nothing was saved."); }
    setSaving(false);
  };

  const modeCard = (v: Mode, title: string, desc: string) => (
    <button type="button" className="adm-mode" aria-pressed={mode === v} onClick={() => { setMode(v); setDirty(true); }}>
      <b>{title}</b><span>{desc}</span>
    </button>
  );

  return (
    <>
      <PageHeader eyebrow="Website content · Homepage" title="Hero" description="The large banner at the top of the homepage.">
        <LinkButton href="/" external icon="ext">View on website</LinkButton>
        <Button variant="primary" icon="plus" onClick={startNew} disabled={!!loadError}>Add slide</Button>
      </PageHeader>

      {loadError ? <Alert>Could not load the current hero ({loadError}). Editing is disabled so the live hero can&apos;t be overwritten. Reload to retry.</Alert> : null}
      {saveError ? <Alert>{saveError}</Alert> : null}

      <h2 className="adm-section-title" style={{ marginTop: 4 }}>Media type</h2>
      <div className="adm-modes">
        {modeCard("image", "Image", "One hero image (desktop + mobile).")}
        {modeCard("video", "Video", "Muted looping video with a poster fallback.")}
        {modeCard("slideshow", "Slideshow", "Multiple slides, each an image or a video.")}
      </div>
      <p className="adm-hint" style={{ margin: "8px 0 0" }}>{mode === "slideshow" ? "All visible slides play in order." : `Only the first visible ${mode} slide is shown on the homepage.`}</p>

      <h2 className="adm-section-title">Slides</h2>
      {loading ? (
        <div className="adm-list">{[0, 1].map((i) => <Skeleton key={i} h={76} r={10} />)}</div>
      ) : slides.length === 0 && !loadError ? (
        <Card><EmptyState title="No hero slides yet" description="The homepage hero is hidden until you add a slide."><Button variant="primary" icon="plus" onClick={startNew}>Add first slide</Button></EmptyState></Card>
      ) : (
        <div className="adm-list">
          {slides.map((s, i) => (
            <div className="adm-row" key={s.id} data-off={!s.active}>
              <div className="adm-reorder">
                <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" size={14} /></Button>
                <Button size="sm" variant="ghost" disabled={i === slides.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" size={14} /></Button>
              </div>
              <Media src={s.srcDesktop} kind={s.type} poster={s.posterSrc} big />
              <div className="adm-row-main">
                <div className="adm-cell-title" style={{ maxWidth: "100%" }}>{i + 1}. {s.headline || "(No headline)"}</div>
                <div className="adm-cell-sub">{s.type === "video" ? "Video" : "Image"} · all devices · {Math.round(s.durationMs / 1000)}s · {s.ctaLabel} → {s.ctaHref}{s.startsAt || s.endsAt ? " · scheduled" : ""}</div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--a-muted)" }}>
                {s.active ? "Live" : "Hidden"}
                <Switch checked={s.active} onChange={(v) => change((p) => p.map((x) => (x.id === s.id ? { ...x, active: v } : x)))} label="Visible on website" />
              </label>
              <Button size="sm" icon="edit" onClick={() => startEdit(s)}>Edit</Button>
              <Button size="icon" variant="danger" aria-label="Delete slide" onClick={async () => { if (await confirm({ title: "Delete this slide?", message: "It is removed from the database when you click Save.", confirmLabel: "Delete slide" })) change((p) => p.filter((x) => x.id !== s.id)); }}><Icon name="trash" size={15} /></Button>
            </div>
          ))}
        </div>
      )}

      {editingId ? (
        <Card title={editingId === "new" ? "New slide" : "Edit slide"} className="" >
          <div style={{ marginTop: -4 }}>
            {formErrors.length ? <Alert><ul>{formErrors.map((e) => <li key={e}>{e}</li>)}</ul></Alert> : null}
            <div className="adm-form-grid">
              <Field label="Slide media">
                <select className="adm-select" value={forced ?? form.type} disabled={!!forced} onChange={(e) => setF("type", e.target.value as Kind)}>
                  <option value="image">Image</option><option value="video">Video</option>
                </select>
              </Field>
              <Field label="Visible on website"><div style={{ height: 38, display: "flex", alignItems: "center" }}><Switch checked={form.active} onChange={(v) => setF("active", v)} label="Visible" /></div></Field>

              <MediaField label={`Hero ${form.type} (all devices)`} hint={form.type === "video" ? "MP4 / WebM, up to 40 MB" : "JPG / PNG / WebP / AVIF, up to 10 MB"} value={form.srcDesktop} kind={form.type} poster={form.posterSrc} onChange={(u) => setF("srcDesktop", u)} onError={(m) => setFormErrors([m])} />
              {form.type === "video" ? <MediaField label="Poster / fallback image (required)" hint="Shown while loading and if the video fails" value={form.posterSrc} kind="image" onChange={(u) => setF("posterSrc", u)} onError={(m) => setFormErrors([m])} /> : null}

              <Field label="Alt text" hint="Describes the media for screen readers" span><input className="adm-input" maxLength={200} value={form.altText} onChange={(e) => setF("altText", e.target.value)} /></Field>
              <Field label="Small label above headline"><input className="adm-input" maxLength={60} value={form.eyebrow} placeholder="Dharma Series EP 01" onChange={(e) => setF("eyebrow", e.target.value)} /></Field>
              <Field label="Headline"><input className="adm-input" maxLength={120} value={form.headline} placeholder="WEAR YOUR DIFFERENCE." onChange={(e) => setF("headline", e.target.value)} /></Field>
              <Field label="Subtitle" span><input className="adm-input" maxLength={200} value={form.subheadline} onChange={(e) => setF("subheadline", e.target.value)} /></Field>
              <Field label="Button text"><input className="adm-input" maxLength={40} value={form.ctaLabel} onChange={(e) => setF("ctaLabel", e.target.value)} /></Field>
              <Field label="Button link"><input className="adm-input" maxLength={512} value={form.ctaHref} placeholder="/collections/all" onChange={(e) => setF("ctaHref", e.target.value)} /></Field>
              <Field label="Focal position" hint="How the media is cropped">
                <select className="adm-select" value={form.objectPosition} onChange={(e) => setF("objectPosition", e.target.value)}>{POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </Field>
              <Field label={`Overlay darkness: ${Math.round(form.overlayOpacity * 100)}%`}><input type="range" min="0" max="0.8" step="0.05" value={form.overlayOpacity} onChange={(e) => setF("overlayOpacity", parseFloat(e.target.value))} /></Field>
              <Field label={`Time on screen: ${Math.round(form.durationMs / 1000)}s`} hint="Slideshow only"><input type="range" min="2000" max="20000" step="1000" value={form.durationMs} onChange={(e) => setF("durationMs", parseInt(e.target.value, 10))} /></Field>
              <span />
              <Field label="Show from (optional)"><input className="adm-input" type="datetime-local" value={toLocal(form.startsAt)} onChange={(e) => setF("startsAt", fromLocal(e.target.value))} /></Field>
              <Field label="Hide after (optional)"><input className="adm-input" type="datetime-local" value={toLocal(form.endsAt)} onChange={(e) => setF("endsAt", fromLocal(e.target.value))} /></Field>
            </div>

            {form.srcDesktop ? (
              <div style={{ marginTop: 18 }}>
                <div className="adm-label" style={{ marginBottom: 6 }}>Preview</div>
                <div style={{ position: "relative", aspectRatio: "16/7", overflow: "hidden", borderRadius: 10, background: "var(--a-brand)" }}>
                  {form.type === "video" && isVideoUrl(form.srcDesktop)
                    ? <video src={form.srcDesktop} poster={form.posterSrc || undefined} muted loop playsInline autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: form.objectPosition }} />
                    : // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.srcDesktop} alt={form.altText} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: form.objectPosition }} />}
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(23,37,84,${form.overlayOpacity}), transparent 60%)` }} />
                  <div style={{ position: "absolute", left: "5%", bottom: "9%", color: "#fff" }}>
                    {form.eyebrow ? <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: "#dab205", textTransform: "uppercase" }}>{form.eyebrow}</div> : null}
                    <div style={{ fontWeight: 800, fontSize: "clamp(1rem,2.6vw,2rem)", textTransform: "uppercase", lineHeight: 1 }}>{form.headline}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="adm-actions" style={{ marginTop: 18 }}>
              <Button variant="primary" onClick={apply}>{editingId === "new" ? "Add slide" : "Apply changes"}</Button>
              <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              <span className="adm-hint">“Apply” updates the list above — click <b>Save hero</b> to publish.</span>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="adm-savebar">
        <span className={dirty ? "adm-dirty" : "adm-hint"}>{dirty ? "You have unsaved changes" : "All changes saved"}</span>
        <Button variant="primary" loading={saving} disabled={!dirty || !!loadError || slides.length === 0} onClick={save}>Save hero</Button>
      </div>
    </>
  );
}
