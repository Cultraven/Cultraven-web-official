"use client";
/**
 * Admin · Products — every value comes from MongoDB (GET /api/products, admin session adds stock).
 * Inline toggles write straight back to the database (optimistic, rolled back on failure).
 */
import React, { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, EmptyState, Icon, LinkButton, PageHeader, Switch, TableSkeleton, inr, useApi, useConfirm, useToast } from "@/components/admin/ui";

interface P {
  id: string; title: string; slug: string; category: string; image: string;
  pricePaise: number; mrpPaise: number; inStock: boolean; stockCount?: number;
  isNewArrival: boolean; isBestseller: boolean; updatedAt?: string | null;
}
type Filter = "all" | "in" | "out" | "low";

const LOW_STOCK = 5;

const Row = memo(function Row({ p, selected, onSelect, onToggle, onDelete }: {
  p: P; selected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string, field: "isNewArrival" | "isBestseller" | "inStock", value: boolean) => void;
  onDelete: (p: P) => void;
}) {
  const stock = p.stockCount ?? 0;
  return (
    <tr>
      <td style={{ width: 36 }}><input type="checkbox" className="adm-check" checked={selected} onChange={() => onSelect(p.id)} aria-label={`Select ${p.title}`} /></td>
      <td>
        <div className="adm-cell-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="adm-thumb" src={p.image} alt="" loading="lazy" decoding="async" />
          <div style={{ minWidth: 0 }}>
            <Link href={`/portal-secure/products/${p.id}/edit`} prefetch={false} className="adm-cell-title" style={{ display: "block" }}>{p.title}</Link>
            <div className="adm-cell-sub">/{p.slug}</div>
          </div>
        </div>
      </td>
      <td style={{ textTransform: "capitalize" }}>{p.category}</td>
      <td className="num">
        <b>{inr(p.pricePaise)}</b>
        {p.mrpPaise > p.pricePaise ? <div className="adm-cell-sub" style={{ textDecoration: "line-through" }}>{inr(p.mrpPaise)}</div> : null}
      </td>
      <td className="num">
        {!p.inStock ? <Badge tone="danger">Out of stock</Badge> : stock <= LOW_STOCK ? <Badge tone="warn">{stock} left</Badge> : <span>{stock}</span>}
      </td>
      <td><Switch checked={p.isNewArrival} onChange={(v) => onToggle(p.id, "isNewArrival", v)} label={`New arrival: ${p.title}`} /></td>
      <td><Switch checked={p.isBestseller} onChange={(v) => onToggle(p.id, "isBestseller", v)} label={`Bestseller: ${p.title}`} /></td>
      <td><Button size="sm" variant={p.inStock ? "danger" : "primary"} onClick={() => onToggle(p.id, "inStock", !p.inStock)} aria-label={p.inStock ? `Mark ${p.title} out of stock` : `Mark ${p.title} back in stock`}>{p.inStock ? "Mark sold out" : "Restock"}</Button></td>
      <td>
        <div className="adm-actions" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <LinkButton href={`/portal-secure/products/${p.id}/edit`} size="sm" icon="edit">Edit</LinkButton>
          <Button size="icon" variant="danger" onClick={() => onDelete(p)} aria-label={`Delete ${p.title}`}><Icon name="trash" size={15} /></Button>
        </div>
      </td>
    </tr>
  );
});

export default function AdminProductsPage() {
  const { data, error, loading, reload, setData } = useApi<{ products: P[] }>("/api/products?limit=100");
  const { toast } = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const products = data?.products ?? [];

  const counts = useMemo(() => ({
    all: products.length,
    in: products.filter((p) => p.inStock).length,
    out: products.filter((p) => !p.inStock).length,
    low: products.filter((p) => p.inStock && (p.stockCount ?? 0) <= LOW_STOCK).length,
  }), [products]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "in" && !p.inStock) return false;
      if (filter === "out" && p.inStock) return false;
      if (filter === "low" && !(p.inStock && (p.stockCount ?? 0) <= LOW_STOCK)) return false;
      return !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.slug.includes(q);
    });
  }, [products, deferredSearch, filter]);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `HTTP ${res.status}`); }
  }, []);

  const onToggle = useCallback(async (id: string, field: "isNewArrival" | "isBestseller" | "inStock", value: boolean) => {
    setData((d) => d && { products: d.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)) });
    try { await patch(id, { [field]: value }); }
    catch (e: any) {
      setData((d) => d && { products: d.products.map((p) => (p.id === id ? { ...p, [field]: !value } : p)) });
      toast(`Could not update: ${e.message}`, "error");
    }
  }, [patch, setData, toast]);

  const remove = useCallback(async (ids: string[]) => {
    const results = await Promise.allSettled(ids.map((id) => fetch(`/api/products/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return id; })));
    const ok = new Set(results.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map((r) => r.value));
    setData((d) => d && { products: d.products.filter((p) => !ok.has(p.id)) });
    setSelected((s) => new Set([...s].filter((id) => !ok.has(id))));
    if (ok.size) toast(`Deleted ${ok.size} product${ok.size === 1 ? "" : "s"}`);
    if (ok.size < ids.length) toast(`${ids.length - ok.size} could not be deleted`, "error");
  }, [setData, toast]);

  const onDelete = useCallback(async (p: P) => {
    if (await confirm({ title: `Delete “${p.title}”?`, message: "This permanently removes it from the database and the website.", confirmLabel: "Delete product" })) remove([p.id]);
  }, [confirm, remove]);

  const onSelect = useCallback((id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const allOn = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(filtered.map((p) => p.id)));

  const bulkDelete = async () => {
    if (await confirm({ title: `Delete ${selected.size} products?`, message: "This permanently removes them from the database and the website.", confirmLabel: "Delete all" })) remove([...selected]);
  };
  const bulkOut = async () => {
    const ids = [...selected];
    setData((d) => d && { products: d.products.map((p) => (selected.has(p.id) ? { ...p, inStock: false } : p)) });
    const res = await Promise.allSettled(ids.map((id) => patch(id, { inStock: false })));
    const failed = res.filter((r) => r.status === "rejected").length;
    toast(failed ? `${failed} could not be updated` : `Marked ${ids.length} out of stock`, failed ? "error" : "success");
    if (failed) reload();
    setSelected(new Set());
  };

  return (
    <>
      <PageHeader eyebrow="Store" title="Products" description="Manage the catalog. New arrival and Bestseller toggles decide what shows on the homepage.">
        <LinkButton href="/portal-secure/products/new" variant="primary" icon="plus">Add product</LinkButton>
      </PageHeader>

      {error ? <Alert>Could not load products ({error}). <Button size="sm" onClick={reload} style={{ marginLeft: 8 }}>Retry</Button></Alert> : null}

      <Card pad={false}>
        <div className="adm-toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input className="adm-input" placeholder="Search title, category or slug…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          </div>
          <div className="adm-seg" role="group" aria-label="Filter by stock">
            {([["all", "All"], ["in", "In stock"], ["low", "Low"], ["out", "Out"]] as [Filter, string][]).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l} <span style={{ opacity: 0.6 }}>{counts[k]}</span></button>
            ))}
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="adm-bulk">
            <span>{selected.size} selected</span>
            <Button size="sm" onClick={bulkOut}>Mark out of stock</Button>
            <Button size="sm" variant="danger" onClick={bulkDelete} icon="trash">Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        ) : null}

        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title={products.length ? "No products match" : "No products yet"} description={products.length ? "Try a different search or filter." : "Add your first product, or run `pnpm db:seed` for sample data."}>
            {!products.length ? <LinkButton href="/portal-secure/products/new" variant="primary" icon="plus">Add product</LinkButton> : null}
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" className="adm-check" checked={allOn} onChange={toggleAll} aria-label="Select all" /></th>
                  <th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th>
                  <th title="Shows in homepage New Arrivals">New</th><th title="Shows in homepage Bestsellers">Best</th><th>Availability</th><th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => <Row key={p.id} p={p} selected={selected.has(p.id)} onSelect={onSelect} onToggle={onToggle} onDelete={onDelete} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
