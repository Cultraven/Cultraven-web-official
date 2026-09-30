"use client";
import React, { memo, useMemo } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, EmptyState, Icon, LinkButton, PageHeader, Skeleton, TableSkeleton, inr, useApi } from "@/components/admin/ui";

type Product = {
  id: string; title: string; slug?: string; category?: string; pricePaise?: number; image?: string;
  stockCount?: number; inStock?: boolean; isNewArrival?: boolean; isBestseller?: boolean;
};
type Order = {
  id: string; customer?: string; email?: string; items?: unknown; total?: unknown; totalPaise?: number;
  status?: string; paymentMethod?: string; date?: string;
};

const LOW = 5;
type Tone = "neutral" | "success" | "warn" | "danger" | "info";
const TONES: Record<string, Tone> = { processing: "warn", shipped: "info", delivered: "success", cancelled: "danger" };
const tone = (s?: string): Tone => TONES[(s || "").toLowerCase()] ?? "neutral";
const fmtDate = (d?: string) => {
  if (!d) return "-";
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const OrderRow = memo(function OrderRow({ o }: { o: Order }) {
  return (
    <tr>
      <td><Link href={`/portal-secure/orders/${o.id}`} style={{ fontWeight: 600 }}>{o.id}</Link></td>
      <td>
        <div className="adm-cell-title">{o.customer || "-"}</div>
      </td>
      <td className="num">{inr(o.totalPaise ?? 0)}</td>
      <td><Badge tone={tone(o.status)}>{o.status || "Unknown"}</Badge></td>
      <td>{fmtDate(o.date)}</td>
    </tr>
  );
});

const LowRow = memo(function LowRow({ p }: { p: Product }) {
  return (
    <Link href={`/portal-secure/products/${p.id}/edit`} className="adm-row">
      <div className="adm-cell-media" style={{ flex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img className="adm-thumb" src={p.image} alt="" loading="lazy" style={{ width: 34, height: 42 }} /> : null}
        <div style={{ minWidth: 0 }}>
          <div className="adm-cell-title" style={{ maxWidth: 200 }}>{p.title}</div>
          <div className="adm-cell-sub">{p.category}</div>
        </div>
      </div>
      <Badge tone={(p.stockCount ?? 0) === 0 ? "danger" : "warn"}>{p.stockCount ?? 0} left</Badge>
    </Link>
  );
});

function Stat({ label, icon, value, sub, loading }: { label: string; icon: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="adm-card adm-stat">
      <div className="adm-stat-label">{label}<span className="adm-stat-ic"><Icon name={icon} size={16} /></span></div>
      {loading ? (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}><Skeleton h={28} w="60%" /><Skeleton h={12} w="40%" /></div>
      ) : (
        <>
          <div className="adm-stat-value">{value}</div>
          <div className="adm-stat-sub">{sub}</div>
        </>
      )}
    </div>
  );
}

const ErrorBox = ({ msg, retry }: { msg: string; retry: () => void }) => (
  <div style={{ padding: 16 }}>
    <Alert>{msg}</Alert>
    <Button size="sm" onClick={retry}>Retry</Button>
  </div>
);

export default function DashboardPage() {
  const prod = useApi<{ products: Product[] }>("/api/products?limit=100");
  const ord = useApi<{ orders: Order[] }>("/api/orders");

  const products = prod.data?.products;
  const orders = ord.data?.orders;

  const stats = useMemo(() => {
    const revenue = (orders ?? []).reduce((s, o) => s + (Number(o.totalPaise) || 0), 0);
    const processing = (orders ?? []).filter((o) => (o.status || "").toLowerCase() === "processing").length;
    const low = (products ?? []).filter((p) => p.inStock !== false && typeof p.stockCount === "number" && p.stockCount <= LOW);
    const flagged = (products ?? []).filter((p) => p.isNewArrival).length;
    const best = (products ?? []).filter((p) => p.isBestseller).length;
    return { revenue, processing, low, flagged, best };
  }, [orders, products]);

  const recent = useMemo(() => (orders ?? []).slice(0, 6), [orders]);

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" description="Live snapshot of your store.">
        <LinkButton href="/portal-secure/cms">Edit website content</LinkButton>
        <LinkButton href="/portal-secure/products/new" variant="primary" icon="plus">Add product</LinkButton>
      </PageHeader>

      <div className="adm-grid adm-grid-4">
        <Stat label="Revenue" icon="rupee" loading={ord.loading} value={inr(stats.revenue)} sub={`from ${orders?.length ?? 0} orders`} />
        <Stat label="Orders" icon="cart" loading={ord.loading} value={String(orders?.length ?? 0)} sub={`${stats.processing} still processing`} />
        <Stat label="Products" icon="box" loading={prod.loading} value={String(products?.length ?? 0)} sub={`${stats.flagged} new arrival, ${stats.best} bestseller`} />
        <Stat label="Low stock" icon="alert" loading={prod.loading} value={String(stats.low.length)} sub={`${LOW} units or fewer`} />
      </div>

      <div className="adm-grid adm-grid-main" style={{ marginTop: 16, alignItems: "start" }}>
        <Card title="Recent orders" pad={false} actions={<LinkButton href="/portal-secure/orders" variant="ghost" size="sm">View all</LinkButton>}>
          {ord.loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : ord.error ? (
            <ErrorBox msg={`Could not load orders: ${ord.error}`} retry={ord.reload} />
          ) : recent.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders will show up here as customers check out." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Order</th><th>Customer</th><th className="num">Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>{recent.map((o) => <OrderRow key={o.id} o={o} />)}</tbody>
              </table>
            </div>
          )}
        </Card>

        <div style={{ display: "grid", gap: 16 }}>
          <Card title="Quick actions">
            <div className="adm-list">
              <Link className="adm-tile" href="/portal-secure/cms/hero"><b>Edit hero</b><span>Image, video or slideshow on the home page.</span></Link>
              <Link className="adm-tile" href="/portal-secure/cms/shop-the-look"><b>Edit Shop the Look</b><span>Curate the looks shown on the storefront.</span></Link>
              <Link className="adm-tile" href="/portal-secure/products"><b>Manage products</b><span>Prices, stock and visibility.</span></Link>
              <Link className="adm-tile" href="/portal-secure/cms"><b>All website content</b><span>Every editable section of the site.</span></Link>
            </div>
          </Card>

          <Card title="Low stock" pad={false}>
            {prod.loading ? (
              <div style={{ padding: 16, display: "grid", gap: 10 }}><Skeleton h={44} /><Skeleton h={44} /><Skeleton h={44} /></div>
            ) : prod.error ? (
              <ErrorBox msg={`Could not load products: ${prod.error}`} retry={prod.reload} />
            ) : stats.low.length === 0 ? (
              <EmptyState title="All stocked up" description="No products are running low right now." />
            ) : (
              <div className="adm-list" style={{ padding: 12 }}>
                {stats.low.slice(0, 8).map((p) => <LowRow key={p.id} p={p} />)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
