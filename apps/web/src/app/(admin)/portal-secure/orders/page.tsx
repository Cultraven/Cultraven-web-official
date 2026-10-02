"use client";
import React, { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, EmptyState, Icon, LinkButton, PageHeader, TableSkeleton, useApi } from "@/components/admin/ui";

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
const label = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : "—");

const Row = React.memo(function Row({ o }: { o: OrderRow }) {
  const href = `/portal-secure/orders/${o.id}`;
  return (
    <tr>
      <td>
        <Link href={href} prefetch={false} style={{ fontWeight: 600 }}>
          #{o.id.slice(-8).toUpperCase()}
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
      <td>{o.date}</td>
      <td><LinkButton href={href} size="sm">View</LinkButton></td>
    </tr>
  );
});

export default function OrdersPage() {
  const { data, error, loading, reload } = useApi<{ orders: OrderRow[] }>("/api/orders");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const dq = useDeferredValue(query);

  const orders = data?.orders ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) { const k = norm(o.status); if (k in c) c[k]++; }
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

  return (
    <>
      <PageHeader eyebrow="Sales" title="Orders" description="Track and fulfil customer orders (latest 100)." />
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
          <div className="adm-seg" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {label(f)} ({counts[f] ?? 0})
              </button>
            ))}
          </div>
        </div>
        {loading && !data ? (
          <TableSkeleton rows={8} cols={7} />
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
                {rows.map((o) => <Row key={o.id} o={o} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
