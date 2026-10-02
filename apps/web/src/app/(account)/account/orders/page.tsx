"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/orders.css";
import { STATUS_LABEL, isOrderStatus } from "@/lib/order-lifecycle";

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const tone = (s: string) => (s === "delivered" ? "is-ok" : s === "cancelled" || s === "returned" || s === "rto" ? "is-bad" : s === "shipped" || s === "out_for_delivery" || s === "packed" ? "is-info" : "is-warn");
const date = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const label = (s: string) => (isOrderStatus(s) ? STATUS_LABEL[s] : s);

interface Item { title: string; image: string; size: string; color: string; quantity: number; pricePaise: number }
interface Order { id: string; number: string; createdAt: string; status: string; totalPaise: number; paymentMethod: string; items: Item[]; tracking: { courier: string; number: string }; canCancel: { ok: boolean; mode?: "direct" | "request" }; canReturn: { ok: boolean }; timeline: { key: string; state: string; label: string }[] }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
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
        <p className="acct-sub">Track every order, download receipts, cancel within 7 days or request a return.</p>
      </header>

      {error ? <p role="alert" style={{ color: "#b42318", fontWeight: 700, marginBottom: "1rem" }}>Couldn&apos;t load your orders ({error}). Please refresh.</p> : null}

      {orders === null && !error ? (
        <div className="acct-card"><div className="acct-card-b" style={{ display: "grid", gap: 14 }}>{[0, 1].map((i) => <div key={i} className="skel" style={{ height: 120 }} />)}</div></div>
      ) : orders && orders.length === 0 ? (
        <div className="acct-card">
          <div className="acct-empty">
            <div className="acct-empty-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 01-8 0" /></svg>
            </div>
            <h3>No orders yet</h3>
            <p>You haven&apos;t placed any orders. Your first drop is waiting.</p>
            <Link href="/collections/all" className="cv-btn cv-btn-navy">Start shopping</Link>
          </div>
        </div>
      ) : (
        <div className="ord-list">
          {orders?.map((o) => {
            const current = o.timeline.find((s) => s.state === "current") ?? [...o.timeline].reverse().find((s) => s.state === "done" || s.state === "bad");
            return (
              <article key={o.id} className="ord-card">
                <div className="ord-head">
                  <div>
                    <h3>Order {o.number}</h3>
                    <small>Placed {date(o.createdAt)} · {o.paymentMethod === "cod" ? "Cash on Delivery" : "Paid online"}</small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b style={{ display: "block", marginBottom: 6 }}>{inr(o.totalPaise)}</b>
                    <span className={`acct-chip ${tone(o.status)}`}>{label(o.status)}</span>
                  </div>
                </div>
                <div className="ord-body">
                  <div className="ord-items">
                    {o.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="ord-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt="" loading="lazy" />
                        <div style={{ minWidth: 0 }}>
                          <b>{item.title}</b>
                          <small>{[item.size, item.color].filter(Boolean).join(" · ")} · Qty {item.quantity}</small>
                        </div>
                        <span className="ord-price">{inr(item.pricePaise * item.quantity)}</span>
                      </div>
                    ))}
                    {o.items.length > 3 ? <small style={{ color: "var(--color-smoke)", fontWeight: 700 }}>+ {o.items.length - 3} more item{o.items.length - 3 > 1 ? "s" : ""}</small> : null}
                  </div>
                  {current ? <div className={`ord-mini ${current.state === "bad" ? "bad" : ""}`}><i />{current.label}{o.tracking.courier ? ` · ${o.tracking.courier}` : ""}</div> : null}
                </div>
                <div className="ord-actions">
                  <Link href={`/account/orders/${o.id}`} className="cv-btn cv-btn-navy cv-btn-sm">Track &amp; details</Link>
                  <a href={`/api/orders/${o.id}/invoice`} className="cv-btn cv-btn-outline cv-btn-sm">Receipt (PDF)</a>
                  {o.canCancel.ok ? <Link href={`/account/orders/${o.id}?action=cancel`} className="cv-btn cv-btn-outline cv-btn-sm">{o.canCancel.mode === "request" ? "Request cancellation" : "Cancel order"}</Link> : null}
                  {o.canReturn.ok ? <Link href={`/account/orders/${o.id}?action=return`} className="cv-btn cv-btn-outline cv-btn-sm">Return</Link> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
