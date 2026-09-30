"use client";
/** Admin · Shop the Look — loads the saved database record; saving writes it back and shows what was stored. */
import React, { useEffect, useState } from "react";
import { MediaUploadButton } from "@/components/admin/MediaUploadButton";
import { Alert, Button, Card, EmptyState, Field, Icon, LinkButton, PageHeader, Skeleton, inr, useConfirm, useToast } from "@/components/admin/ui";

interface LookProduct { id: string; title: string; category: string; href: string; image: string; pricePaise: number; color: string }
interface Look { lookLabel: string; modelImage: string; products: LookProduct[] }

const EMPTY_PRODUCT: LookProduct = { id: "", title: "", category: "", href: "", image: "", pricePaise: 0, color: "" };

export default function AdminShopTheLookPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [look, setLook] = useState<Look>({ lookLabel: "LOOK 01", modelImage: "", products: [] });
  const [hasRecord, setHasRecord] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [pf, setPf] = useState<LookProduct>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cms/shop-the-look", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        if (d.look) { setLook(d.look); setHasRecord(true); }
      })
      .catch((e) => setLoadError(e.message || "Could not load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const edit = (fn: (l: Look) => Look) => { setLook(fn); setDirty(true); setError(null); };
  const move = (i: number, d: -1 | 1) => edit((l) => { const j = i + d; if (j < 0 || j >= l.products.length) return l; const p = [...l.products]; [p[i], p[j]] = [p[j], p[i]]; return { ...l, products: p }; });

  const startEdit = (i: number) => { setEditingIdx(i); setPf({ ...look.products[i] }); };
  const startNew = () => { setEditingIdx(-1); setPf({ ...EMPTY_PRODUCT, id: `l${Date.now()}` }); };
  const applyProduct = () => {
    if (!pf.title || !pf.href || !pf.image) { setError("Product title, link and image are required."); return; }
    edit((l) => {
      const p = [...l.products];
      if (editingIdx === -1) p.push(pf); else if (editingIdx !== null) p[editingIdx] = pf;
      return { ...l, products: p };
    });
    setEditingIdx(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/shop-the-look", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ look }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { if (d.look) setLook(d.look); setHasRecord(true); setDirty(false); toast("Saved — the website shows this look"); }
      else setError(d.error || "Save failed");
    } catch { setError("Network error — nothing was saved."); }
    setSaving(false);
  };

  return (
    <>
      <PageHeader eyebrow="Website content · Homepage" title="Shop the Look" description="A model photo with the shoppable pieces beside it.">
        <LinkButton href="/" external icon="ext">View on website</LinkButton>
      </PageHeader>

      {loadError ? <Alert>Could not load the saved look ({loadError}). Saving is disabled so live data can&apos;t be overwritten. Reload to retry.</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      {!hasRecord && !loading && !loadError ? <Alert kind="info">No look configured yet — the section is hidden on the website. Fill this in and save to create it.</Alert> : null}

      {loading ? <Card><div style={{ display: "grid", gap: 12 }}><Skeleton h={38} /><Skeleton h={38} /></div></Card> : (
        <div className="adm-grid">
          <Card title="Look">
            <div className="adm-form-grid">
              <Field label="Label"><input className="adm-input" value={look.lookLabel} onChange={(e) => edit((l) => ({ ...l, lookLabel: e.target.value }))} placeholder="LOOK 01" /></Field>
              <Field label="Model image" hint="The large photo on the left">
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="adm-input" type="url" value={look.modelImage} onChange={(e) => edit((l) => ({ ...l, modelImage: e.target.value }))} placeholder="https://… or upload" />
                  <MediaUploadButton hasValue={!!look.modelImage} onUploaded={(u) => edit((l) => ({ ...l, modelImage: u }))} onError={setError} />
                </div>
              </Field>
            </div>
            {look.modelImage ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={look.modelImage} alt="Model preview" loading="lazy" style={{ marginTop: 14, height: 140, borderRadius: 8, objectFit: "cover" }} /> : null}
          </Card>

          <Card title={`Pieces in this look (${look.products.length})`} actions={<Button size="sm" icon="plus" onClick={startNew}>Add piece</Button>}>
            {look.products.length === 0 ? <EmptyState title="No pieces yet" description="Add the products shoppers can buy from this look." /> : (
              <div className="adm-list">
                {look.products.map((p, i) => (
                  <div key={p.id || i} className="adm-row">
                    <div className="adm-reorder">
                      <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><Icon name="up" size={14} /></Button>
                      <Button size="sm" variant="ghost" disabled={i === look.products.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><Icon name="down" size={14} /></Button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="adm-thumb" src={p.image} alt="" loading="lazy" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="adm-cell-title" style={{ maxWidth: "100%" }}>{p.title || "(No title)"}</div>
                      <div className="adm-cell-sub">{p.category} · {p.color} · {p.pricePaise ? inr(p.pricePaise) : "—"} · {p.href}</div>
                    </div>
                    <Button size="sm" icon="edit" onClick={() => startEdit(i)}>Edit</Button>
                    <Button size="icon" variant="danger" aria-label="Remove piece" onClick={async () => { if (await confirm({ title: "Remove this piece?", message: "It is removed from the database when you click Save.", confirmLabel: "Remove" })) edit((l) => ({ ...l, products: l.products.filter((_, k) => k !== i) })); }}><Icon name="trash" size={15} /></Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {editingIdx !== null ? (
            <Card title={editingIdx === -1 ? "Add piece" : "Edit piece"}>
              <div className="adm-form-grid">
                <Field label="Product title" required span><input className="adm-input" value={pf.title} onChange={(e) => setPf((p) => ({ ...p, title: e.target.value }))} placeholder="RAVEN OVERSIZED TEE — ACID BLACK" /></Field>
                <Field label="Category label"><input className="adm-input" value={pf.category} onChange={(e) => setPf((p) => ({ ...p, category: e.target.value }))} placeholder="T-SHIRT" /></Field>
                <Field label="Colour"><input className="adm-input" value={pf.color} onChange={(e) => setPf((p) => ({ ...p, color: e.target.value }))} placeholder="Acid Black" /></Field>
                <Field label="Price (₹)"><input className="adm-input" type="number" min="0" step="0.01" value={pf.pricePaise ? pf.pricePaise / 100 : ""} onChange={(e) => setPf((p) => ({ ...p, pricePaise: Math.round((parseFloat(e.target.value) || 0) * 100) }))} /></Field>
                <Field label="Product link" required><input className="adm-input" value={pf.href} onChange={(e) => setPf((p) => ({ ...p, href: e.target.value }))} placeholder="/products/slug" /></Field>
                <Field label="Thumbnail image" required span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="adm-input" type="url" value={pf.image} onChange={(e) => setPf((p) => ({ ...p, image: e.target.value }))} placeholder="https://… or upload" />
                    <MediaUploadButton hasValue={!!pf.image} onUploaded={(u) => setPf((p) => ({ ...p, image: u }))} onError={setError} />
                  </div>
                </Field>
              </div>
              <div className="adm-actions" style={{ marginTop: 16 }}>
                <Button variant="primary" onClick={applyProduct}>{editingIdx === -1 ? "Add piece" : "Apply changes"}</Button>
                <Button variant="ghost" onClick={() => setEditingIdx(null)}>Cancel</Button>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <div className="adm-savebar">
        <span className={dirty ? "adm-dirty" : "adm-hint"}>{dirty ? "You have unsaved changes" : "All changes saved"}</span>
        <Button variant="primary" loading={saving} disabled={!dirty || !!loadError} onClick={save}>Save changes</Button>
      </div>
    </>
  );
}
