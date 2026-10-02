"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const tone = (s: string) => (s === "delivered" ? "is-ok" : s === "cancelled" || s === "returned" ? "is-bad" : s === "shipped" ? "is-info" : "is-warn");
/** Orders store sku as `${slug}-${size}`; recover the slug for the product link. */
const slugOf = (i: { sku?: string; size?: string }) => { const sku = i.sku ?? ""; const tail = `-${i.size ?? ""}`; return i.size && sku.endsWith(tail) ? sku.slice(0, -tail.length) : sku; };
const date = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/orders/me", { signal: ac.signal, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        setOrders(d.orders ?? []);
      })
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => ac.abort();
  }, []);

  return (
    <>
      <header className="acct-head">
        <span className="acct-eyebrow">My account</span>
        <h1 className="acct-title">Order history</h1>
        <p className="acct-sub">Every order you&apos;ve placed, with live status.</p>
      </header>

      {error ? <p role="alert" style={{ color: "#b42318", fontWeight: 700, marginBottom: "1rem" }}>Couldn&apos;t load your orders ({error}). Please refresh.</p> : null}

      {orders === null && !error ? (
        <div className="acct-card"><div className="acct-card-b" style={{ display: "grid", gap: 14 }}>{[0, 1].map((i) => <div key={i} className="skel" style={{ height: 88 }} />)}</div></div>
      ) : orders && orders.length === 0 ? (
        <div className="acct-card">
          <div className="acct-empty">
            <div className="acct-empty-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 01-8 0" /></svg>
            </div>
            <h3>No orders yet</h3>
            <p>You haven&apos;t placed any orders. Your first drop is waiting.</p>
            <Link href="/collections/all" className="cv-btn cv-btn-navy">
              Start shopping
              <svg className="cv-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {orders?.map((order) => (
            <article key={order._id} className="acct-card">
              <div className="acct-card-h">
                <div>
                  <h3>Order {order.razorpayOrderId ?? String(order._id).slice(-6).toUpperCase()}</h3>
                  <small style={{ color: "var(--color-smoke)", fontSize: "0.74rem" }}>Placed {date(order.createdAt)}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <b style={{ color: "var(--color-navy)", fontSize: "1rem", display: "block", marginBottom: 6 }}>{inr(order.totalPaise)}</b>
                  <span className={`acct-chip ${tone(order.fulfillmentStatus)}`}>{order.fulfillmentStatus}</span>
                </div>
              </div>
              <div className="acct-card-b" style={{ display: "grid", gap: "1rem" }}>
                {order.items?.map((item: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" loading="lazy" style={{ width: 64, height: 80, objectFit: "cover", border: "2px solid var(--color-navy)", background: "var(--color-bone)" }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--color-navy)", letterSpacing: "0.03em" }}>{item.title}</b>
                      <small style={{ color: "var(--color-smoke)", fontSize: "0.76rem" }}>
                        {[item.size, item.color].filter(Boolean).join(" · ")}{item.size || item.color ? " · " : ""}Qty {item.quantity}
                      </small>
                    </div>
                    <div style={{ textAlign: "right", display: "grid", gap: 6, justifyItems: "end" }}>
                      <b style={{ color: "var(--color-navy)", fontSize: "0.85rem" }}>{inr(item.pricePaise)}</b>
                      {order.fulfillmentStatus !== "cancelled" && order.fulfillmentStatus !== "returned" ? (
                        <Link href={`/products/${slugOf(item)}#reviews`} className="cv-btn cv-btn-outline cv-btn-sm">Review</Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              {order.trackingLink ? (
                <div style={{ padding: "0 1.35rem 1.35rem" }}>
                  <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="cv-btn cv-btn-outline cv-btn-sm">Track shipment</a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
