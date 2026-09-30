"use client";
/**
 * Generic CMS section editor. Renders a form from the field schema in lib/cms/registry.ts.
 * The database record is the only source of truth:
 *   load → GET /api/cms/sections/<key> (saved record, or an intentional empty state)
 *   edit → temporary UI state only
 *   save → client validation → PUT (server validates + writes MongoDB) → UI replaced by the stored record
 */
import React, { memo, useEffect, useState } from "react";
import { SECTION_MAP, validateFields, type Field } from "@/lib/cms/registry";
import { MediaUploadButton } from "./MediaUploadButton";
import { Alert, Button, Card, EmptyState, Field as FormField, Icon, LinkButton, PageHeader, Skeleton, Switch, useConfirm, useToast } from "./ui";

type Obj = Record<string, any>;

const blank = (fields: Field[]): Obj => validateFields(fields, {}).value;
const toLocal = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function MediaPreview({ src, video }: { src: string; video?: boolean }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src) return <div className="adm-media">No media</div>;
  if (broken) return <div className="adm-media" style={{ color: "var(--a-danger)" }}>Broken URL</div>;
  return (
    <div className="adm-media">
      {video ? (
        <video src={src} muted playsInline preload="metadata" onError={() => setBroken(true)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
      )}
    </div>
  );
}

const FieldInput = memo(function FieldInput({ f, value, onChange, onError }: { f: Field; value: any; onChange: (v: any) => void; onError: (m: string) => void }) {
  switch (f.kind) {
    case "boolean":
      return (
        <label className="adm-check">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} /> {f.label}
        </label>
      );
    case "select":
      return (
        <FormField label={f.label}>
          <select className="adm-select" value={value ?? f.default ?? f.options[0]} onChange={(e) => onChange(e.target.value)}>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </FormField>
      );
    case "number":
      return (
        <FormField label={`${f.label}: ${value ?? f.default}`} hint={f.help}>
          <input type="range" min={f.min} max={f.max} step={f.max > 100 ? 500 : 1} value={value ?? f.default} onChange={(e) => onChange(Number(e.target.value))} />
        </FormField>
      );
    case "textarea":
      return (
        <FormField label={f.label} required={f.required} span>
          <textarea className="adm-textarea" value={value ?? ""} rows={3} maxLength={f.max ?? 2000} onChange={(e) => onChange(e.target.value)} />
        </FormField>
      );
    case "image":
    case "video":
      return (
        <FormField label={f.label} required={f.required} span>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <MediaPreview src={value ?? ""} video={f.kind === "video"} />
            <div style={{ flex: 1, display: "grid", gap: 8 }}>
              <input className="adm-input" type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" />
              <div className="adm-actions">
                <MediaUploadButton kind={f.kind} hasValue={!!value} onUploaded={onChange} onError={onError} />
                {value ? <Button size="sm" variant="danger" onClick={() => onChange("")}>Remove</Button> : null}
              </div>
            </div>
          </div>
        </FormField>
      );
    case "datetime":
      return (
        <FormField label={f.label}>
          <input className="adm-input" type="datetime-local" value={toLocal(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </FormField>
      );
    case "list":
      return <ListEditor f={f} value={Array.isArray(value) ? value : []} onChange={onChange} onError={onError} />;
    default:
      return (
        <FormField label={f.label} required={f.required} hint={f.help}>
          <input className="adm-input" type={f.kind === "url" ? "url" : "text"} value={value ?? ""} maxLength={f.max ?? 2048} onChange={(e) => onChange(e.target.value)} placeholder={f.kind === "link" ? "/collections/all or https://…" : undefined} />
        </FormField>
      );
  }
});

function ObjectFields({ fields, value, onChange, onError }: { fields: Field[]; value: Obj; onChange: (v: Obj) => void; onError: (m: string) => void }) {
  return (
    <div className="adm-form-grid">
      {fields.map((f) => (
        <div key={f.key} className={f.kind === "list" || f.kind === "textarea" || f.kind === "image" || f.kind === "video" ? "adm-span-all" : undefined}>
          <FieldInput f={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} onError={onError} />
        </div>
      ))}
    </div>
  );
}

function ListEditor({ f, value, onChange, onError }: { f: Extract<Field, { kind: "list" }>; value: Obj[]; onChange: (v: Obj[]) => void; onError: (m: string) => void }) {
  const confirm = useConfirm();
  const [open, setOpen] = useState<string | null>(null);
  const hasActive = f.fields.some((x) => x.key === "active");
  const imgField = f.fields.find((x) => x.kind === "image");

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="adm-label">{f.label} <span style={{ color: "var(--a-faint)", fontWeight: 500 }}>({value.length}{f.max ? ` / ${f.max}` : ""})</span></span>
        <Button size="sm" icon="plus" onClick={add} disabled={!!f.max && value.length >= f.max}>Add</Button>
      </div>
      {value.length === 0 ? <div className="adm-hint" style={{ marginBottom: 6 }}>Nothing here yet.</div> : null}
      <div className="adm-list">
        {value.map((item, i) => {
          const id = item.id ?? String(i);
          const isOpen = open === id;
          const title = (f.itemTitleKey && String(item[f.itemTitleKey] ?? "").trim()) || `${f.label.replace(/s$/, "")} ${i + 1}`;
          return (
            <div key={id}>
              <div className="adm-row" data-off={hasActive && item.active === false} style={isOpen ? { borderRadius: "10px 10px 0 0" } : undefined}>
                <div className="adm-reorder">
                  <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down"><Icon name="down" size={14} /></Button>
                </div>
                {imgField ? <MediaPreview src={item[imgField.key] ?? ""} /> : null}
                <button type="button" onClick={() => setOpen(isOpen ? null : id)} className="adm-row-main" style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "inherit" }}>
                  {i + 1}. {title}
                </button>
                {hasActive ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--a-muted)" }}>
                    {item.active === false ? "Hidden" : "Live"}
                    <Switch checked={item.active !== false} onChange={(v) => onChange(value.map((x, k) => (k === i ? { ...x, active: v } : x)))} label="Visible on website" />
                  </label>
                ) : null}
                <Button size="sm" onClick={() => setOpen(isOpen ? null : id)}>{isOpen ? "Close" : "Edit"}</Button>
                <Button size="icon" variant="danger" aria-label="Delete entry" onClick={async () => { if (await confirm({ title: "Remove this entry?", message: "It is deleted from the database when you click Save.", confirmLabel: "Remove" })) onChange(value.filter((_, k) => k !== i)); }}><Icon name="trash" size={15} /></Button>
              </div>
              {isOpen ? (
                <div className="adm-row-body">
                  <ObjectFields fields={f.fields.filter((x) => x.key !== "active")} value={item} onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))} onError={onError} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SectionEditor({ sectionKey }: { sectionKey: string }) {
  const def = SECTION_MAP[sectionKey];
  const { toast } = useToast();
  const [value, setValue] = useState<Obj | null>(null); // null = no DB record yet
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!def) return;
    const ac = new AbortController();
    setLoading(true);
    fetch(`/api/cms/sections/${sectionKey}`, { cache: "no-store", signal: ac.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        setValue(d.state === "ok" ? d.data : null);
      })
      .catch((e) => e.name !== "AbortError" && setLoadError(e.message))
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [sectionKey, def]);

  // warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!def) return <Alert>Unknown section.</Alert>;

  const change = (v: Obj) => { setValue(v); setDirty(true); setErrors([]); };

  const save = async () => {
    if (!value) return;
    const { errors: errs } = validateFields(def.fields, value); // client validation (server re-validates)
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch(`/api/cms/sections/${sectionKey}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: value }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setValue(d.data); // exactly what the database stored
        setDirty(false);
        toast("Saved — the website is updated");
      } else setErrors(d.errors ?? [d.error || `Save failed (HTTP ${res.status})`]);
    } catch {
      setErrors(["Network error — nothing was saved."]);
    }
    setSaving(false);
  };

  return (
    <>
      <PageHeader eyebrow={`Website content · ${def.group}`} title={def.label} description={def.description}>
        <LinkButton href={def.previewPath} external icon="ext">View on website</LinkButton>
      </PageHeader>

      {loadError ? <Alert>Could not load the saved content ({loadError}). Editing is disabled so live data can&apos;t be overwritten. Reload to retry.</Alert> : null}
      {errors.length ? <Alert>{errors.length === 1 ? errors[0] : <ul>{errors.slice(0, 6).map((m) => <li key={m}>{m}</li>)}</ul>}</Alert> : null}

      {loading ? (
        <Card><div style={{ display: "grid", gap: 14 }}><Skeleton h={38} /><Skeleton h={38} /><Skeleton h={120} /></div></Card>
      ) : !value && !loadError ? (
        <Card><EmptyState title="No content configured yet." description="This section is hidden on the website until you create it.">
          <Button variant="primary" onClick={() => change(blank(def.fields))}>Create content</Button>
        </EmptyState></Card>
      ) : value ? (
        <>
          <Card>
            <ObjectFields fields={def.fields} value={value} onChange={change} onError={(m) => setErrors([m])} />
          </Card>
          <div className="adm-savebar">
            <span className={dirty ? "adm-dirty" : "adm-hint"}>{dirty ? "You have unsaved changes" : "All changes saved"}</span>
            <Button variant="primary" loading={saving} disabled={!dirty || !!loadError} onClick={save}>Save changes</Button>
          </div>
        </>
      ) : null}
    </>
  );
}
