"use client";
/**
 * Generic CMS section editor. Renders a form from the field schema in
 * lib/cms/registry.ts. The database record is the only source of truth:
 *
 *   load  → GET /api/cms/sections/<key>  (saved DB record, or an intentional empty state)
 *   edit  → temporary UI state only
 *   save  → client validation → PUT (server validates + writes MongoDB + revalidates)
 *           → UI replaced by the record the database returned
 */
import React, { useEffect, useState } from "react";
import { SECTION_MAP, validateFields, type Field } from "@/lib/cms/registry";
import { MediaUploadButton } from "./MediaUploadButton";

type Obj = Record<string, any>;

const INPUT: React.CSSProperties = { width: "100%", padding: "0.65rem 0.85rem", backgroundColor: "#0F1419", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: "0.82rem", color: "var(--color-cream)", outline: "none", fontFamily: "var(--font-sans)" };
const LABEL: React.CSSProperties = { display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)", marginBottom: "0.35rem" };
const SMALL_BTN: React.CSSProperties = { padding: "5px 10px", backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,241,232,0.8)", fontWeight: 600, fontSize: "0.7rem", border: "none", borderRadius: 3, cursor: "pointer" };

const blank = (fields: Field[]): Obj => validateFields(fields, {}).value;
const toLocal = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function MediaPreview({ src, video }: { src: string; video?: boolean }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const box: React.CSSProperties = { width: 96, height: 60, borderRadius: 3, overflow: "hidden", backgroundColor: "#0F1419", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", color: "rgba(245,241,232,0.3)", flexShrink: 0 };
  if (!src) return <div style={box}>No media</div>;
  if (broken) return <div style={{ ...box, color: "#F87171" }}>Broken URL</div>;
  return (
    <div style={box}>
      {video ? (
        <video src={src} muted playsInline preload="metadata" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
  );
}

function FieldInput({ f, value, onChange, onError }: { f: Field; value: any; onChange: (v: any) => void; onError: (m: string) => void }) {
  switch (f.kind) {
    case "boolean":
      return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8rem", color: "rgba(245,241,232,0.85)" }}>
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} /> {f.label}
        </label>
      );
    case "select":
      return (
        <div>
          <label style={LABEL}>{f.label}</label>
          <select value={value ?? f.default ?? f.options[0]} onChange={(e) => onChange(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    case "number":
      return (
        <div>
          <label style={LABEL}>{f.label} ({value ?? f.default})</label>
          <input type="range" min={f.min} max={f.max} step={f.max > 100 ? 500 : 1} value={value ?? f.default} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      );
    case "textarea":
      return (
        <div>
          <label style={LABEL}>{f.label}{f.required ? " *" : ""}</label>
          <textarea value={value ?? ""} rows={3} maxLength={f.max ?? 2000} onChange={(e) => onChange(e.target.value)} style={{ ...INPUT, resize: "vertical" }} />
        </div>
      );
    case "image":
    case "video":
      return (
        <div>
          <label style={LABEL}>{f.label}{f.required ? " *" : ""}</label>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <MediaPreview src={value ?? ""} video={f.kind === "video"} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" style={INPUT} />
              <div style={{ display: "flex", gap: 6 }}>
                <MediaUploadButton kind={f.kind} hasValue={!!value} onUploaded={onChange} onError={onError} />
                {value && <button type="button" style={{ ...SMALL_BTN, color: "#F87171" }} onClick={() => onChange("")}>Remove</button>}
              </div>
            </div>
          </div>
        </div>
      );
    case "datetime":
      return (
        <div>
          <label style={LABEL}>{f.label}</label>
          <input type="datetime-local" value={toLocal(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} style={INPUT} />
        </div>
      );
    case "list":
      return <ListEditor f={f} value={Array.isArray(value) ? value : []} onChange={onChange} onError={onError} />;
    default:
      return (
        <div>
          <label style={LABEL}>{f.label}{f.required ? " *" : ""}</label>
          <input type={f.kind === "url" ? "url" : "text"} value={value ?? ""} maxLength={f.max ?? 2048} onChange={(e) => onChange(e.target.value)} placeholder={f.kind === "link" ? "/collections/all or https://…" : undefined} style={INPUT} />
        </div>
      );
  }
}

function ObjectFields({ fields, value, onChange, onError }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void; onError: (m: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      {fields.map((f) => (
        <div key={f.key} style={{ gridColumn: f.kind === "list" || f.kind === "textarea" || f.kind === "image" || f.kind === "video" ? "1/-1" : undefined }}>
          <FieldInput f={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} onError={onError} />
        </div>
      ))}
    </div>
  );
}

function ListEditor({ f, value, onChange, onError }: { f: Extract<Field, { kind: "list" }>; value: Obj[]; onChange: (v: Obj[]) => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const hasActive = f.fields.some((x) => x.key === "active");
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const c = [...value];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
  };
  const add = () => {
    const item = { id: `new-${Date.now()}`, ...blank(f.fields) };
    onChange([...value, item]);
    setOpen(item.id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={LABEL}>{f.label} ({value.length}{f.max ? ` / ${f.max}` : ""})</span>
        <button type="button" style={SMALL_BTN} onClick={add} disabled={!!f.max && value.length >= f.max}>+ Add</button>
      </div>
      {value.length === 0 && <p style={{ fontSize: "0.75rem", color: "rgba(245,241,232,0.35)", margin: "0 0 8px" }}>None yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {value.map((item, i) => {
          const id = item.id ?? String(i);
          const isOpen = open === id;
          const title = (f.itemTitleKey && String(item[f.itemTitleKey] ?? "").trim()) || `${f.label.replace(/s$/, "")} ${i + 1}`;
          const imgField = f.fields.find((x) => x.kind === "image");
          return (
            <div key={id} style={{ backgroundColor: "#151D29", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, opacity: hasActive && item.active === false ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.6rem 0.8rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} style={{ ...SMALL_BTN, padding: "1px 7px", opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                  <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} style={{ ...SMALL_BTN, padding: "1px 7px", opacity: i === value.length - 1 ? 0.3 : 1 }}>▼</button>
                </div>
                {imgField && <MediaPreview src={item[imgField.key] ?? ""} />}
                <button type="button" onClick={() => setOpen(isOpen ? null : id)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", color: "var(--color-cream)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {i + 1}. {title}
                </button>
                {hasActive && (
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", color: item.active === false ? "rgba(245,241,232,0.4)" : "#10B981", cursor: "pointer" }}>
                    <input type="checkbox" checked={item.active !== false} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, active: e.target.checked } : x)))} />
                    {item.active === false ? "Hidden" : "Live"}
                  </label>
                )}
                <button type="button" style={SMALL_BTN} onClick={() => setOpen(isOpen ? null : id)}>{isOpen ? "Close" : "Edit"}</button>
                <button type="button" style={{ ...SMALL_BTN, color: "#F87171" }} onClick={() => confirm("Remove this entry? It is deleted from the database when you click Save.") && onChange(value.filter((_, k) => k !== i))}>Delete</button>
              </div>
              {isOpen && (
                <div style={{ padding: "0.9rem 1rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <ObjectFields fields={f.fields.filter((x) => x.key !== "active")} value={item} onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))} onError={onError} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SectionEditor({ sectionKey }: { sectionKey: string }) {
  const def = SECTION_MAP[sectionKey];
  const [value, setValue] = useState<Obj | null>(null); // null = no DB record yet
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string[] } | null>(null);

  useEffect(() => {
    if (!def) return;
    setLoading(true);
    fetch(`/api/cms/sections/${sectionKey}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        setValue(d.state === "ok" ? d.data : null);
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [sectionKey, def]);

  if (!def) return <p style={{ padding: "2rem", color: "#FCA5A5" }}>Unknown section.</p>;

  const change = (v: Obj) => { setValue(v); setDirty(true); setStatus(null); };

  const save = async () => {
    if (!value) return;
    const { errors } = validateFields(def.fields, value); // client validation (server re-validates)
    if (errors.length) { setStatus({ kind: "error", msg: errors }); return; }
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/cms/sections/${sectionKey}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: value }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setValue(d.data); // replace UI with exactly what the database stored
        setDirty(false);
        setStatus({ kind: "ok", msg: ["Saved to the database. The website now shows this content."] });
      } else {
        setStatus({ kind: "error", msg: d.errors ?? [d.error || `Save failed (HTTP ${res.status})`] });
      }
    } catch {
      setStatus({ kind: "error", msg: ["Network error — nothing was saved."] });
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: 980 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: 6 }}>Content / {def.group}</p>
          <h1 style={{ fontWeight: 800, fontSize: "1.65rem", color: "var(--color-cream)", letterSpacing: "-0.02em" }}>{def.label}</h1>
          <p style={{ fontSize: "0.8rem", color: "rgba(245,241,232,0.5)", marginTop: 4, maxWidth: 560 }}>{def.description}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {dirty && <span style={{ fontSize: "0.72rem", color: "#FBBF24" }}>Unsaved changes</span>}
          <a href={def.previewPath} target="_blank" rel="noopener noreferrer" style={{ ...SMALL_BTN, padding: "0.7rem 1rem", textDecoration: "none" }}>View on website ↗</a>
          <button type="button" onClick={save} disabled={saving || !value || !!loadError} style={{ padding: "0.7rem 1.4rem", backgroundColor: "var(--color-lava)", color: "var(--color-navy)", fontWeight: 800, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer", opacity: saving || !value || loadError ? 0.55 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, color: "#FCA5A5", fontSize: "0.82rem" }}>
          Could not load the saved content ({loadError}). Editing is disabled so the live data can&apos;t be overwritten. Reload to retry.
        </div>
      )}
      {status && (
        <ul role={status.kind === "error" ? "alert" : "status"} style={{ margin: "0 0 1.25rem", padding: "0.85rem 1.25rem 0.85rem 2rem", borderRadius: 6, fontSize: "0.8rem", backgroundColor: status.kind === "ok" ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${status.kind === "ok" ? "rgba(16,185,129,0.4)" : "rgba(248,113,113,0.4)"}`, color: status.kind === "ok" ? "#6EE7B7" : "#FCA5A5", listStyle: status.msg.length > 1 ? "disc" : "none" }}>
          {status.msg.slice(0, 6).map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}

      {loading ? (
        <p style={{ color: "rgba(245,241,232,0.5)", fontSize: "0.85rem" }}>Loading…</p>
      ) : !value && !loadError ? (
        <div style={{ padding: "2.5rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.18)", borderRadius: 8 }}>
          <p style={{ color: "var(--color-cream)", fontWeight: 700, marginBottom: 6 }}>No content configured yet.</p>
          <p style={{ color: "rgba(245,241,232,0.45)", fontSize: "0.8rem", marginBottom: 16 }}>This section is currently hidden on the website. Create it to get started.</p>
          <button type="button" disabled={creating} onClick={() => { setCreating(true); change(blank(def.fields)); setCreating(false); }} style={{ ...SMALL_BTN, padding: "0.7rem 1.4rem", fontSize: "0.78rem" }}>
            Create content
          </button>
        </div>
      ) : value ? (
        <div style={{ backgroundColor: "#1A2332", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1.5rem" }}>
          <ObjectFields fields={def.fields} value={value} onChange={change} onError={(m) => setStatus({ kind: "error", msg: [m] })} />
        </div>
      ) : null}
    </div>
  );
}
