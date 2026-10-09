"use client";
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, EmptyState, Icon, LinkButton, PageHeader, TableSkeleton, useApi, useToast } from "@/components/admin/ui";
import { STATUS_LABEL, isOrderStatus } from "@/lib/order-lifecycle";

type OrderRow = {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: string;
  totalPaise: number;
  status: string;
  paymentMethod: string;
  date: string;
};

const FILTERS = ["all", "processing", "confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed", "delivered", "return_requested", "returned", "rto", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const TONES: Record<string, "warn" | "info" | "success" | "danger"> = {
  processing: "warn", confirmed: "info", packed: "info", on_hold: "warn", shipped: "info", out_for_delivery: "info", delivery_failed: "warn",
  delivered: "success", cancelled: "danger", rto: "danger", return_requested: "warn", returned: "danger",
};
const norm = (s: string) => (s || "").toLowerCase();
const label = (s: string) => (s === "all" ? "All" : isOrderStatus(s) ? STATUS_LABEL[s] : s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—");
const shortId = (id: string) => `#${id.slice(-8).toUpperCase()}`;

/** Where the Excel / PDF file comes from. No ids = every order in the database. */
const exportUrl = (format: "xlsx" | "pdf", ids?: string[]) => `/api/admin/orders/export?format=${format}${ids ? `&ids=${ids.join(",")}` : ""}`;
const download = (format: "xlsx" | "pdf", ids?: string[]) => { window.location.assign(exportUrl(format, ids)); };

const Row = React.memo(function Row({ o, selected, onToggle, onDelete }: { o: OrderRow; selected: boolean; onToggle: (id: string) => void; onDelete?: (o: OrderRow) => void }) {
  const href = `/portal-secure/orders/${o.id}`;
  return (
    <tr data-selected={selected ? "true" : undefined}>
      <td style={{ width: 40 }}>
        <input type="checkbox" className="adm-pick" checked={selected} onChange={() => onToggle(o.id)} aria-label={`Select order ${shortId(o.id)}`} />
      </td>
      <td>
        <Link href={href} prefetch={false} style={{ fontWeight: 600 }}>
          {shortId(o.id)}
        </Link>
      </td>
      <td>
        <div className="adm-cell-title">{o.customer}</div>
        {o.email ? <div className="adm-cell-sub">{o.email}</div> : null}
      </td>
      <td>{o.items}</td>
      <td className="num">{o.total}</td>
      <td><Badge tone={TONES[norm(o.status)] ?? "neutral"}>{label(o.status)}</Badge></td>
      <td>{o.paymentMethod}</td>
      <td style={{ whiteSpace: "nowrap" }}>{o.date}</td>
      <td>
        <div className="adm-actions" style={{ flexWrap: "nowrap", justifyContent: "flex-end" }}>
          <LinkButton href={href} size="sm">View / edit</LinkButton>
          {onDelete ? <Button size="icon" variant="danger" aria-label={`Delete order ${shortId(o.id)}`} onClick={() => onDelete(o)}><Icon name="trash" size={15} /></Button> : null}
        </div>
      </td>
    </tr>
  );
});

/** One "Download" button for both file types: Excel or PDF, for what's ticked / on screen, or for every order. */
function DownloadMenu({ shown, picked }: { shown: string[]; picked: string[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const set = picked.length ? picked : shown;
  const go = (format: "xlsx" | "pdf", ids?: string[]) => { setOpen(false); download(format, ids); };
  return (
    <div className="adm-menu" ref={box}>
      <Button icon="download" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>Download</Button>
      {open ? (
        <div className="adm-menu-panel" role="menu" aria-label="Download orders">
          <div className="adm-menu-h">{picked.length ? `Selected (${picked.length})` : `Shown on screen (${shown.length})`}</div>
          <button type="button" role="menuitem" disabled={set.length === 0} onClick={() => go("xlsx", set)}><Icon name="download" size={16} /> Excel (.xlsx)</button>
          <button type="button" role="menuitem" disabled={set.length === 0} onClick={() => go("pdf", set)}><Icon name="download" size={16} /> PDF</button>
          <hr />
          <div className="adm-menu-h">Every order in the shop</div>
          <button type="button" role="menuitem" onClick={() => go("xlsx")}><Icon name="download" size={16} /> Excel (.xlsx) — all orders</button>
          <button type="button" role="menuitem" onClick={() => go("pdf")}><Icon name="download" size={16} /> PDF — all orders</button>
        </div>
      ) : null}
    </div>
  );
}

/** Typed-confirmation dialog: orders are the shop's sales records, so deleting needs a deliberate "DELETE". */
function DeleteOrdersModal({ orders, onClose, onDone }: { orders: OrderRow[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const worth = orders.reduce((s, o) => s + (o.totalPaise || 0), 0);
  const unshipped = orders.filter((o) => ["processing", "confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed"].includes(norm(o.status))).length;
  const many = orders.length > 1;

  const run = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: orders.map((o) => o.id), confirm: "DELETE" }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      toast(`Deleted ${j.deleted} order${j.deleted === 1 ? "" : "s"}${j.stockReleased ? ` · stock put back for ${j.stockReleased}` : ""}`);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete");
      setBusy(false);
    }
  };

  return (
    <div className="adm-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="del-orders-title" style={{ width: "min(500px, 100%)" }}>
        <h3 id="del-orders-title">Delete {many ? `${orders.length} orders` : `order ${shortId(orders[0].id)}`}?</h3>
        <p style={{ marginBottom: 10 }}>
          {many ? "These orders" : "This order"} (worth ₹{(worth / 100).toLocaleString("en-IN")}) will be removed from the shop for good. {many ? "Customers" : "The customer"} will no longer see {many ? "them" : "it"} in their account.
        </p>
        <ul style={{ margin: "0 0 14px 18px", listStyle: "disc", color: "var(--a-muted)", fontSize: 13.5, display: "grid", gap: 4 }}>
          <li>Money already paid online is <b>not</b> refunded by deleting. Refund it in Razorpay first if needed.</li>
          {unshipped ? <li>{unshipped} {unshipped === 1 ? "is" : "are"} still on its way — the reserved stock goes back on the shelf.</li> : null}
          <li>A backup copy of each deleted order is kept in the database.</li>
        </ul>
        <div style={{ marginBottom: 14 }}>
          <Button size="sm" icon="download" onClick={() => download("xlsx", orders.map((o) => o.id))}>Download an Excel copy first</Button>
        </div>
        <label className="adm-field">
          <span className="adm-label">Type <b>DELETE</b> to confirm</span>
          <input className="adm-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus placeholder="DELETE" onKeyDown={(e) => { if (e.key === "Enter" && typed === "DELETE" && !busy) run(); }} />
        </label>
        {err ? <div role="alert" className="adm-alert adm-alert-error" style={{ marginTop: 12 }}><div>{err}</div></div> : null}
        <div className="adm-modal-actions" style={{ marginTop: 18 }}>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" loading={busy} disabled={typed !== "DELETE"} onClick={run}>{many ? `Delete ${orders.length} orders` : "Delete order"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { data, error, loading, reload } = useApi<{ orders: OrderRow[] }>("/api/orders");
  const { data: me } = useApi<{ role: "admin" | "superadmin" }>("/api/admin/me");
  const canDelete = me?.role === "superadmin";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<OrderRow[] | null>(null);
  const dq = useDeferredValue(query);

  const orders = data?.orders ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = Object.fromEntries(FILTERS.map((f) => [f, 0]));
    c.all = orders.length;
    for (const o of orders) { const k = norm(o.status); if (k in c && k !== "all") c[k]++; }
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    const q = dq.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && norm(o.status) !== filter) return false;
      if (!q) return true;
      return o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    });
  }, [orders, dq, filter]);

  // A ticked order that is filtered out (or gone after a delete) is no longer ticked.
  useEffect(() => {
    setPicked((p) => {
      if (p.size === 0) return p;
      const visible = new Set(rows.map((r) => r.id));
      const next = new Set([...p].filter((id) => visible.has(id)));
      return next.size === p.size ? p : next;
    });
  }, [rows]);

  const toggle = React.useCallback((id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.id));
  const headBox = useRef<HTMLInputElement>(null);
  useEffect(() => { if (headBox.current) headBox.current.indeterminate = picked.size > 0 && !allPicked; }, [picked, allPicked]);
  const pickedIds = [...picked];
  const askDelete = React.useCallback((o: OrderRow) => setToDelete([o]), []);

  return (
    <>
      <PageHeader eyebrow="Sales" title="Orders" description="Track and fulfil customer orders (latest 100 shown — downloads can include every order).">
        <DownloadMenu shown={rows.map((r) => r.id)} picked={pickedIds} />
      </PageHeader>
      {error ? (
        <Alert>
          <span>{error} </span>
          <Button size="sm" onClick={reload}>Retry</Button>
        </Alert>
      ) : null}
      <Card pad={false}>
        <div className="adm-toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input
              className="adm-input"
              type="search"
              aria-label="Search orders by id, customer or email"
              placeholder="Search order, customer, email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="adm-seg adm-seg-wrap" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {label(f)} ({counts[f] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {picked.size > 0 ? (
          <div className="adm-bulk" role="region" aria-label="Selected orders">
            <span>{picked.size} selected</span>
            {!allPicked ? <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(rows.map((r) => r.id)))}>Select all {rows.length} shown</Button> : null}
            <span style={{ flex: 1 }} />
            <Button size="sm" icon="download" onClick={() => download("xlsx", pickedIds)}>Excel</Button>
            <Button size="sm" icon="download" onClick={() => download("pdf", pickedIds)}>PDF</Button>
            {canDelete ? <Button size="sm" variant="danger" icon="trash" onClick={() => setToDelete(rows.filter((r) => picked.has(r.id)))}>Delete selected</Button> : null}
            <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
          </div>
        ) : null}

        {loading && !data ? (
          <TableSkeleton rows={8} cols={9} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={orders.length === 0 ? "No orders yet" : "No matching orders"}
            description={orders.length === 0 ? "Orders will appear here once customers check out." : "Try a different search or status filter."}
          />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 40 }}>
                    <input ref={headBox} type="checkbox" className="adm-pick" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(rows.map((r) => r.id)))} aria-label={`Select all ${rows.length} orders shown`} />
                  </th>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Items</th>
                  <th scope="col" className="num">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Date</th>
                  <th scope="col"><span style={{ position: "absolute", left: -9999 }}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => <Row key={o.id} o={o} selected={picked.has(o.id)} onToggle={toggle} onDelete={canDelete ? askDelete : undefined} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toDelete ? <DeleteOrdersModal orders={toDelete} onClose={() => setToDelete(null)} onDone={() => { setToDelete(null); setPicked(new Set()); reload(); }} /> : null}
    </>
  );
}
