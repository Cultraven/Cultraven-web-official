"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploadButton } from "./MediaUploadButton";
import { Alert, Button, Card, Field, Icon, LinkButton, PageHeader, Switch, useToast } from "./ui";

const colorsToText = (colors: { hex: string; label: string }[] | undefined) => (colors ?? []).map((c) => `${c.label}:${c.hex}`).join(", ");
const textToColors = (text: string) =>
  text.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const [label, hex] = p.split(":").map((x) => x.trim());
    return { label: label ?? "", hex: hex ?? "" };
  });
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const toRupees = (paise: number | undefined) => (paise ? String(paise / 100) : "");

export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = !!initialData;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(editing);
  const [gallery, setGallery] = useState<string[]>(Array.isArray(initialData?.images) ? initialData.images : []);
  const [f, setF] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    price: toRupees(initialData?.pricePaise),
    mrp: toRupees(initialData?.mrpPaise),
    description: initialData?.description || "",
    category: initialData?.category || "tees",
    fit: initialData?.fit || "oversized",
    image: initialData?.image || "",
    hoverImage: initialData?.hoverImage || "",
    inStock: initialData ? initialData.inStock !== false : true,
    stockCount: String(initialData?.stockCount ?? 50),
    sizes: initialData?.sizes?.join(", ") || "S, M, L, XL",
    colors: colorsToText(initialData?.colors),
    badge: initialData?.badge || "",
    isNewArrival: initialData?.isNewArrival === true,
    isBestseller: initialData?.isBestseller === true,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const moveGallery = (i: number, d: -1 | 1) =>
    setGallery((g) => { const j = i + d; if (j < 0 || j >= g.length) return g; const c = [...g]; [c[i], c[j]] = [c[j], c[i]]; return c; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Math.round(parseFloat(f.price) * 100);
    const mrp = f.mrp ? Math.round(parseFloat(f.mrp) * 100) : price;
    const local: string[] = [];
    if (!(price > 0)) local.push("Enter a selling price greater than 0.");
    if (mrp < price) local.push("MRP cannot be lower than the selling price.");
    if (!f.image) local.push("A main image is required.");
    if (local.length) { setErrors(local); return; }

    setSaving(true);
    setErrors([]);
    const payload = {
      title: f.title, slug: f.slug || slugify(f.title), description: f.description, category: f.category, fit: f.fit,
      image: f.image, hoverImage: f.hoverImage || (editing ? "" : undefined), images: gallery.filter(Boolean),
      pricePaise: price, mrpPaise: mrp,
      sizes: f.sizes.split(",").map((s: string) => s.trim()).filter(Boolean),
      colors: textToColors(f.colors), badge: f.badge || null,
      inStock: f.inStock, stockCount: Math.max(0, parseInt(f.stockCount, 10) || 0),
      isNewArrival: f.isNewArrival, isBestseller: f.isBestseller,
    };
    try {
      const res = await fetch(editing ? `/api/products/${initialData._id ?? initialData.id}` : "/api/products", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast(editing ? "Product saved" : "Product created");
        router.push("/portal-secure/products");
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        const issues: Record<string, string[]> | undefined = j.issues;
        setErrors(issues ? Object.entries(issues).flatMap(([k, v]) => v.map((m) => `${k}: ${m}`)) : [j.error || "Save failed"]);
      }
    } catch {
      setErrors(["Network error — nothing was saved."]);
    } finally {
      setSaving(false);
    }
  };

  const mediaInput = (label: string, value: string, onChange: (v: string) => void, required?: boolean) => (
    <Field label={label} required={required}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="adm-thumb" src={value} alt="" style={{ width: 38, height: 46 }} /> : null}
        <input className="adm-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" />
        <MediaUploadButton hasValue={!!value} onUploaded={onChange} onError={(m) => setErrors([m])} />
      </div>
    </Field>
  );

  return (
    <form onSubmit={submit}>
      <PageHeader eyebrow="Store" title={editing ? "Edit product" : "New product"} description={editing ? f.title : "Fill in the basics, add images, then publish."}>
        <LinkButton href="/portal-secure/products" variant="ghost">Cancel</LinkButton>
      </PageHeader>

      {errors.length ? <Alert>{errors.length === 1 ? errors[0] : <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>}</Alert> : null}

      <div className="adm-grid adm-grid-main" style={{ alignItems: "start" }}>
        <div className="adm-grid">
          <Card title="Basics">
            <div className="adm-form-grid">
              <Field label="Title" required span>
                <input className="adm-input" required value={f.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="URL slug" hint="a-z, 0-9 and dashes. Shown in the product link." required>
                <input className="adm-input" required value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} pattern="[a-z0-9\-]+" />
              </Field>
              <Field label="Category" required>
                <input className="adm-input" required value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="tees, hoodies, bottoms…" />
              </Field>
              <Field label="Description" required span>
                <textarea className="adm-textarea" required rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Images">
            <div className="adm-form-grid">
              <div className="adm-span-all">{mediaInput("Main image", f.image, (v) => set("image", v), true)}</div>
              <div className="adm-span-all">{mediaInput("Hover image", f.hoverImage, (v) => set("hoverImage", v))}</div>
            </div>
            <div style={{ marginTop: 18 }}>
              <div className="adm-label">Gallery (product page, in this order)</div>
              <div className="adm-hint" style={{ marginBottom: 8 }}>Leave empty to use the main + hover image.</div>
              <div className="adm-list">
                {gallery.map((url, i) => (
                  <div key={i} className="adm-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="adm-thumb" src={url} alt="" style={{ width: 40, height: 50 }} />
                    <input className="adm-input adm-row-main" value={url} onChange={(e) => setGallery((g) => g.map((x, k) => (k === i ? e.target.value : x)))} />
                    <div className="adm-reorder">
                      <Button size="sm" variant="ghost" onClick={() => moveGallery(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => moveGallery(i, 1)} disabled={i === gallery.length - 1} aria-label="Move down"><Icon name="down" size={14} /></Button>
                    </div>
                    <Button size="icon" variant="danger" onClick={() => setGallery((g) => g.filter((_, k) => k !== i))} aria-label="Remove"><Icon name="trash" size={15} /></Button>
                  </div>
                ))}
              </div>
              <div className="adm-actions" style={{ marginTop: 10 }}>
                <MediaUploadButton onUploaded={(u) => setGallery((g) => [...g, u])} onError={(m) => setErrors([m])} />
                <Button size="sm" icon="plus" onClick={() => setGallery((g) => [...g, ""])}>Add URL</Button>
              </div>
            </div>
          </Card>

          <Card title="Variants">
            <div className="adm-form-grid">
              <Field label="Sizes" hint="Comma separated"><input className="adm-input" required value={f.sizes} onChange={(e) => set("sizes", e.target.value)} /></Field>
              <Field label="Fit">
                <select className="adm-select" value={f.fit} onChange={(e) => set("fit", e.target.value)}>
                  {["oversized", "relaxed", "boxy", "baggy", "regular"].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Colors" hint="Name:#hex, comma separated" span>
                <input className="adm-input" value={f.colors} onChange={(e) => set("colors", e.target.value)} placeholder="Black:#0A0A0A, Olive:#556B2F" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="adm-grid">
          <Card title="Pricing">
            <div className="adm-form-grid">
              <Field label="Selling price (₹)" required><input className="adm-input" required type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
              <Field label="MRP (₹)" hint="Shows a discount badge"><input className="adm-input" type="number" min="0" step="0.01" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} /></Field>
            </div>
          </Card>

          <Card title="Inventory">
            <div className="adm-form-grid">
              <Field label="Units in stock"><input className="adm-input" type="number" min="0" value={f.stockCount} onChange={(e) => set("stockCount", e.target.value)} /></Field>
              <Field label="Badge" hint="e.g. LIMITED, LOW STOCK"><input className="adm-input" maxLength={30} value={f.badge} onChange={(e) => set("badge", e.target.value)} /></Field>
            </div>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {([
                ["inStock", "Available to buy", "Turn off to mark out of stock."],
                ["isNewArrival", "New arrival", "Shows in the homepage “New Drop”."],
                ["isBestseller", "Bestseller", "Shows in the homepage “Bestsellers”."],
              ] as const).map(([k, title, desc]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div><div style={{ fontWeight: 600 }}>{title}</div><div className="adm-hint">{desc}</div></div>
                  <Switch checked={f[k]} onChange={(v) => set(k, v)} label={title} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="adm-savebar">
        <span className="adm-hint">{editing ? "Changes go live as soon as you save." : "The product goes live as soon as you save."}</span>
        <div className="adm-actions">
          <LinkButton href="/portal-secure/products" variant="ghost">Cancel</LinkButton>
          <Button variant="primary" type="submit" loading={saving}>{editing ? "Save changes" : "Create product"}</Button>
        </div>
      </div>
    </form>
  );
}
