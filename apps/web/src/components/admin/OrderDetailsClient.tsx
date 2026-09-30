"use client";
import React, { useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, LinkButton, PageHeader, Skeleton, inr, useApi, useToast } from "./ui";

type Item = { productId?: string; title: string; image?: string; size?: string; color?: string; quantity: number; pricePaise: number };
type Address = { name?: string; email?: string; phone?: string; addressLine1?: string; addressLine2?: string; city?: string; state?: string; pincode?: string };
type Order = {
  _id: string;
  orderNumber?: string;
  razorpayOrderId?: string;
  items?: Item[];
  subtotalPaise?: number;
  discountPaise?: number;
  shippingPaise?: number;
  codFeePaise?: number;
  totalPaise?: number;
  deliveryAddress?: Address;
  paymentMethod?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  createdAt?: string;
};

const STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;
const TONES: Record<string, "warn" | "info" | "success" | "danger"> = { processing: "warn", shipped: "info", delivered: "success", cancelled: "danger" };
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "—");

function Line({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="adm-actions" style={{ justifyContent: "space-between", padding: "4px 0", fontWeight: strong ? 700 : 400 }}>
      <span className={strong ? undefined : "adm-cell-sub"}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

export default function OrderDetailsClient({ id }: { id: string }) {
  const { data, error, loading, reload, setData } = useApi<{ order: Order }>(`/api/orders/${id}`);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const order = data?.order;

  async function changeStatus(next: string) {
    if (!order) return;
    const prev = order.fulfillmentStatus;
    setData({ order: { ...order, fulfillmentStatus: next } });
    setSaving(true);
    try {
      const r = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentStatus: next }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      toast(`Order marked ${next}`);
    } catch (e) {
      setData({ order: { ...order, fulfillmentStatus: prev } });
      toast(e instanceof Error ? e.message : "Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  }

  const back = <LinkButton href="/portal-secure/orders" variant="ghost" icon="chevron">Back to orders</LinkButton>;

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Loading order…">{back}</PageHeader>
        <div className="adm-grid adm-grid-main">
          <Card><Skeleton h={180} /></Card>
          <Card><Skeleton h={180} /></Card>
        </div>
      </>
    );
  }

  if (error || !order) {
    const notFound = error === "Order not found";
    return (
      <>
        <PageHeader title={notFound ? "Order not found" : "Order"}>{back}</PageHeader>
        {notFound || !error ? (
          <Card><EmptyState title="Order not found" description="It may have been removed or the link is incorrect." /></Card>
        ) : (
          <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert>
        )}
      </>
    );
  }

  const status = (order.fulfillmentStatus || "processing").toLowerCase();
  const a = order.deliveryAddress ?? {};
  const items = order.items ?? [];
  const subtotal = order.subtotalPaise ?? items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const title = order.razorpayOrderId || order.orderNumber || order._id;
  const addr = [a.addressLine1, a.addressLine2, [a.city, a.state].filter(Boolean).join(", "), a.pincode].filter(Boolean);

  return (
    <>
      <PageHeader title={`Order ${title}`} description={order.createdAt ? `Placed ${new Date(order.createdAt).toLocaleString("en-IN")}` : undefined}>
        {back}
        <Badge tone={TONES[status] ?? "neutral"}>{cap(status)}</Badge>
        <select
          className="adm-select"
          style={{ width: 160 }}
          aria-label="Fulfilment status"
          value={STATUSES.includes(status as (typeof STATUSES)[number]) ? status : ""}
          disabled={saving}
          onChange={(e) => changeStatus(e.target.value)}
        >
          {!STATUSES.includes(status as (typeof STATUSES)[number]) ? <option value="" disabled>{cap(status)}</option> : null}
          {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select>
      </PageHeader>

      <div className="adm-grid adm-grid-main">
        <Card title={`Items (${items.length})`} pad={false}>
          {items.length === 0 ? (
            <EmptyState title="No items" />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col" className="num">Price</th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={`${it.productId ?? it.title}-${i}`}>
                      <td>
                        <div className="adm-cell-media">
                          {it.image ? <img className="adm-thumb" src={it.image} alt="" loading="lazy" /> : <div className="adm-thumb" />}
                          <div>
                            <div className="adm-cell-title">{it.title}</div>
                            <div className="adm-cell-sub">{[it.size && `Size ${it.size}`, it.color].filter(Boolean).join(" · ")}</div>
                          </div>
                        </div>
                      </td>
                      <td>× {it.quantity}</td>
                      <td className="num">{inr(it.pricePaise * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="adm-list">
          <Card title="Customer">
            <div style={{ fontWeight: 600 }}>{a.name || "Unknown"}</div>
            {a.email ? <div className="adm-cell-sub">{a.email}</div> : null}
            {a.phone ? <div className="adm-cell-sub">{a.phone}</div> : null}
          </Card>
          <Card title="Delivery address">
            {addr.length ? addr.map((l, i) => <div key={i}>{l}</div>) : <span className="adm-cell-sub">No address on file</span>}
          </Card>
          <Card title="Payment">
            <Line k="Method" v={(order.paymentMethod || "—").toUpperCase()} />
            <Line k="Status" v={cap(order.paymentStatus)} />
            <Line k="Subtotal" v={inr(subtotal)} />
            {order.discountPaise ? <Line k="Discount" v={`− ${inr(order.discountPaise)}`} /> : null}
            <Line k="Shipping" v={order.shippingPaise ? inr(order.shippingPaise) : "Free"} />
            {order.codFeePaise ? <Line k="COD fee" v={inr(order.codFeePaise)} /> : null}
            <Line k="Total" v={inr(order.totalPaise ?? 0)} strong />
          </Card>
        </div>
      </div>
    </>
  );
}
