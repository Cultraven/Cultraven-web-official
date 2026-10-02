"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploadButton } from "./MediaUploadButton";
import { Alert, Button, Card, Field, Icon, LinkButton, PageHeader, Switch, useToast } from "./ui";
import { FREE_SIZE, discountPercent, effectiveSizes, type SizeOption } from "@/lib/size-pricing";
import { MAX_DISCOUNT_PERCENT, parseDiscountInput, priceFromDiscount } from "@/lib/discount";
import { formatPriceINR } from "@shop/types";

const colorsToText = (colors: { hex: string; label: string }[] | undefined) => (colors ?? []).map((c) => `${c.label}:${c.hex}`).join(", ");
const textToColors = (text: string) =>
  text.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const [label, hex] = p.split(":").map((x) => x.trim());
    return { label: label ?? "", hex: hex ?? "" };
  });
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const toRupees = (paise: number | undefined) => (paise ? String(paise / 100) : "");
const paiseOf = (rupees: string) => { const v = parseFloat(rupees); return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0; };

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

  // Discount offer: the admin gives a % off the MRP and the selling price is worked out (whole rupees). Typing a price
  // instead shows the % it works out to. What's saved is just price + MRP, so every page and the server charge the same.
  const [discount, setDiscount] = useState(() => {
    const d = discountPercent(initialData?.pricePaise ?? 0, initialData?.mrpPaise ?? 0);
    return d > 0 ? String(d) : "";
  });

  // Per-size price / MRP / stock overrides (blank = use the product's base price, stock not tracked per size)
  type Row = { price: string; mrp: string; stock: string };
  const [sizeOpt, setSizeOpt] = useState<Record<string, Row>>(() => {
    const m: Record<string, Row> = {};
    for (const o of (initialData?.sizeOptionsAdmin ?? initialData?.sizeOptions ?? []) as SizeOption[]) {
      m[o.size] = { price: o.pricePaise ? String(o.pricePaise / 100) : "", mrp: o.mrpPaise ? String(o.mrpPaise / 100) : "", stock: o.stockCount !== undefined ? String(o.stockCount) : "" };
    }
    return m;
  });
  const sizeList = effectiveSizes(f.sizes.split(",").map((x: string) => x.trim()).filter(Boolean));
  const setOpt = (size: string, k: keyof Row, v: string) =>
    setSizeOpt((m) => {
      const row = { ...(m[size] ?? { price: "", mrp: "", stock: "" }), [k]: v };
      // a size with its own MRP follows the discount offer
      const d = parseDiscountInput(discount);
      if (k === "mrp" && d && paiseOf(v)) row.price = String(priceFromDiscount(paiseOf(v), d) / 100);
      return { ...m, [size]: row };
    });

  const onMrp = (v: string) => {
    const d = parseDiscountInput(discount);
    setF((p) => ({ ...p, mrp: v, ...(d && paiseOf(v) ? { price: String(priceFromDiscount(paiseOf(v), d) / 100) } : {}) }));
  };
  const onPrice = (v: string) => {
    setF((p) => ({ ...p, price: v }));
    const mrp = paiseOf(f.mrp), price = paiseOf(v);
    setDiscount(mrp && price ? (price < mrp ? String(discountPercent(price, mrp)) : "") : "");
  };
  const onDiscount = (v: string) => {
    setDiscount(v);
    const d = parseDiscountInput(v);
    const mrp = paiseOf(f.mrp);
    if (d === null || !mrp) return;
    const clean = (rupees: string) => (paiseOf(rupees) ? String(priceFromDiscount(paiseOf(rupees), d) / 100) : rupees);
    setF((p) => ({ ...p, price: String(priceFromDiscount(mrp, d) / 100) }));
    setSizeOpt((m) => Object.fromEntries(Object.entries(m).map(([size, r]) => [size, r.mrp.trim() && paiseOf(r.mrp) ? { ...r, price: clean(r.mrp) } : r])));
  };
  const discountTyped = parseDiscountInput(discount);
  const discountBad = discount.trim() !== "" && (discountTyped === null || Number(discount) > MAX_DISCOUNT_PERCENT || Number(discount) < 0);
  const livePrice = paiseOf(f.price), liveMrp = paiseOf(f.mrp) || livePrice;
  const liveOff = discountPercent(livePrice, liveMrp);

  const moveGallery = (i: number, d: -1 | 1) =>
    setGallery((g) => { const j = i + d; if (j < 0 || j >= g.length) return g; const c = [...g]; [c[i], c[j]] = [c[j], c[i]]; return c; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Math.round(parseFloat(f.price) * 100);
    const mrp = f.mrp ? Math.round(parseFloat(f.mrp) * 100) : price;
    const local: string[] = [];
    if (!(price > 0)) local.push("Enter a selling price greater than 0.");
    if (mrp < price) local.push("MRP cannot be lower than the selling price.");
    if (discountBad) local.push(`Discount must be a number from 0 to ${MAX_DISCOUNT_PERCENT}.`);
    if (parseDiscountInput(discount) && !f.mrp.trim()) local.push("Enter the MRP to apply a discount.");
    if (!f.image) local.push("A main image is required.");
    const sizeOptions: { size: string; pricePaise?: number; mrpPaise?: number; stockCount?: number }[] = [];
    for (const size of sizeList) {
      const r = sizeOpt[size];
      if (!r || (!r.price.trim() && !r.mrp.trim() && !r.stock.trim())) continue;
      const o: { size: string; pricePaise?: number; mrpPaise?: number; stockCount?: number } = { size };
      if (r.price.trim()) { const v = Math.round(parseFloat(r.price) * 100); if (!(v > 0)) local.push(`Size ${size}: price must be greater than 0 (or leave it blank to use the base price).`); else o.pricePaise = v; }
      if (r.mrp.trim()) { const v = Math.round(parseFloat(r.mrp) * 100); if (!(v > 0)) local.push(`Size ${size}: MRP must be greater than 0 (or leave it blank).`); else o.mrpPaise = v; }
      if (r.stock.trim()) { const v = Number(r.stock); if (!Number.isInteger(v) || v < 0) local.push(`Size ${size}: stock must be a whole number, 0 or more (or leave it blank).`); else o.stockCount = v; }
      const effPrice = o.pricePaise ?? price;
      if (o.mrpPaise !== undefined && o.mrpPaise < effPrice) local.push(`Size ${size}: MRP can't be lower than its price.`);
      sizeOptions.push(o);
    }
    if (local.length) { setErrors(local); return; }

    setSaving(true);
    setErrors([]);
    const payload = {
      title: f.title, slug: f.slug || slugify(f.title), description: f.description, category: f.category, fit: f.fit,
      image: f.image, hoverImage: f.hoverImage || (editing ? "" : undefined), images: gallery.filter(Boolean),
      pricePaise: price, mrpPaise: mrp,
      sizes: f.sizes.split(",").map((s: string) => s.trim()).filter(Boolean),
      sizeOptions,
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

          <Card title=”Variants”>
            <div className=”adm-form-grid”>
              <Field label=”Sizes” hint={f.sizes.trim() ? “Comma separated, e.g. S, M, L, XL” : “Empty = sold as Free Size”}><input className=”adm-input” value={f.sizes} onChange={(e) => set(“sizes”, e.target.value)} placeholder=”S, M, L, XL” /></Field>
              <Field label=”Fit”>
                <select className=”adm-select” value={f.fit} onChange={(e) => set(“fit”, e.target.value)}>
                  {[“oversized”, “relaxed”, “boxy”, “baggy”, “regular”].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label=”Colors” hint=”Name:#hex, comma separated” span>
                <input className=”adm-input” value={f.colors} onChange={(e) => set(“colors”, e.target.value)} placeholder=”Black:#0A0A0A, Olive:#556B2F” />
              </Field>
            </div>
            <p className=”adm-hint” style={{ marginTop: 10 }}>
              💡 To set a <b>different price per size</b> (e.g. XL costs more), use the <b>Per-size pricing &amp; stock</b> card on the right →
            </p>
          </Card>
        </div>

        <div className=”adm-grid”>
          <Card title=”Pricing & discount”>
            <div className="adm-form-grid">
              <Field label="MRP (₹)" hint="The original price (shown struck through)"><input className="adm-input" type="number" min="0" step="0.01" value={f.mrp} onChange={(e) => onMrp(e.target.value)} aria-label="MRP" /></Field>
              <Field label="Discount (%)" hint={`0–${MAX_DISCOUNT_PERCENT}. Works out the selling price`}>
                <input className="adm-input" type="number" min="0" max={MAX_DISCOUNT_PERCENT} step="1" inputMode="decimal" value={discount} onChange={(e) => onDiscount(e.target.value)} placeholder="e.g. 20" aria-label="Discount percent" aria-invalid={discountBad || undefined} disabled={!f.mrp.trim()} />
              </Field>
              <Field label="Selling price (₹)" required hint="What the customer pays" span><input className="adm-input" required type="number" min="0" step="0.01" value={f.price} onChange={(e) => onPrice(e.target.value)} aria-label="Selling price" /></Field>
            </div>
            <p className="adm-hint" style={{ marginTop: 10 }} data-testid="price-preview">
              {livePrice > 0
                ? <>Shoppers see <b>{formatPriceINR(livePrice)}</b>{liveOff > 0 ? <> <s>{formatPriceINR(liveMrp)}</s> <b style={{ color: "#15803d" }}>{liveOff}% OFF</b></> : " (no discount)"} on the shop, the product page and the bag.</>
                : "Enter the MRP and a discount, or type the selling price."}
            </p>
          </Card>

          <Card title="Per-size pricing & stock">
            <p className="adm-hint" style={{ marginBottom: 12 }}>
              Leave any field blank to inherit the base price above. Set a different price for XL, or enter stock counts to track availability per size. Changes go live on the product page the moment you save.
              {sizeList.length === 1 && sizeList[0] === FREE_SIZE ? " Add sizes in the Variants card first." : ""}
            </p>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Selling price (₹)</th>
                    <th scope="col">MRP (₹)</th>
                    <th scope="col">Discount</th>
                    <th scope="col">Stock (units)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeList.map((size) => {
                    const r = sizeOpt[size] ?? { price: "", mrp: "", stock: "" };
                    const pr = paiseOf(r.price) || livePrice;
                    const mr = paiseOf(r.mrp) || liveMrp;
                    const off = discountPercent(pr, mr);
                    return (
                      <tr key={size}>
                        <td style={{ fontWeight: 800, fontSize: 14 }}>{size}</td>
                        <td>
                          <input className="adm-input" style={{ minWidth: 100 }} type="number" min="0" step="0.01" inputMode="decimal"
                            value={r.price} onChange={(e) => setOpt(size, "price", e.target.value)}
                            placeholder={f.price || "same as base"} aria-label={`Selling price for size ${size}`} />
                        </td>
                        <td>
                          <input className="adm-input" style={{ minWidth: 100 }} type="number" min="0" step="0.01" inputMode="decimal"
                            value={r.mrp} onChange={(e) => setOpt(size, "mrp", e.target.value)}
                            placeholder={f.mrp || f.price || "same as base"} aria-label={`MRP for size ${size}`} />
                        </td>
                        <td data-testid={`off-${size}`} style={{ fontWeight: 700, whiteSpace: "nowrap", color: off > 0 ? "#15803d" : "var(--a-muted)" }}>
                          {off > 0 ? `${off}% off` : "—"}
                        </td>
                        <td>
                          <input className="adm-input" style={{ minWidth: 100 }} type="number" min="0" step="1" inputMode="numeric"
                            value={r.stock} onChange={(e) => setOpt(size, "stock", e.target.value)}
                            placeholder="not tracked" aria-label={`Stock for size ${size}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="adm-hint" style={{ marginTop: 8 }}>Stock = 0 → that size shows "Sold out" on the product page. Blank → stock not tracked for that size.</p>
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
