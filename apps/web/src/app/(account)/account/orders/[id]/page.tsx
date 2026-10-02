"use client";
/**
 * /account/orders/<id> — one order: live tracking timeline, courier details, items, address, totals,
 * status history, receipt download, and (when allowed) cancel within 7 days / return within 7 days of delivery.
 * Everything comes from MongoDB via GET /api/orders/<id>; the server re-checks the rules on every action.
 */
import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "@/styles/orders.css";
import { CANCEL_REASONS, RETURN_REASONS, STATUS_LABEL, isOrderStatus, type TimelineStep } from "@/lib/order-lifecycle";

const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const when = (d?: string | null) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
const tone = (s: string) => (s === "delivered" ? "is-ok" : s === "cancelled" || s === "returned" ? "is-bad" : s === "shipped" || s === "out_for_delivery" ? "is-info" : "is-warn");

interface Order {
  id: string; number: string; createdAt: string; status: string; paymentMethod: "cod" | "razorpay"; paymentStatus: string;
  items: { productId: string; sku: string; title: string; image: string; size: string; color: string; quantity: number; pricePaise: number }[];
  subtotalPaise: number; discountPaise: number; shippingPaise: number; codFeePaise: number; totalPaise: number;
  address: { name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string };
  tracking: { courier: string; number: string; url: string };
  deliveredAt: string | null; cancelReason: string; returnReason: string;
  timeline: TimelineStep[]; history: { status: string; note?: string; at: string; by?: string }[];
  canCancel: { ok: boolean; reason?: string; daysLeft?: number; mode?: "direct" | "request" }; cancelRequested: boolean; cancelRequestReason: string; canReturn: { ok: boolean; reason?: string; daysLeft?: number };
}

/** Product slug from sku (`<slug>-<size>`), for the review link. */
const slugOf = (i: { sku?: string; size?: string }) => { const sku = i.sku ?? ""; const tail = `-${i.size ?? ""}`; return i.size && sku.endsWith(tail) ? sku.slice(0, -tail.length) : sku; };

function ReasonDialog({ kind, onClose, onDone, orderId, request }: { kind: "cancel" | "return"; onClose: () => void; onDone: (msg: string) => void; orderId: string; request?: boolean }) {
  const reasons = kind === "cancel" ? CANCEL_REASONS : RETURN_REASONS;
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) { setErr("Please choose a reason."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/orders/${orderId}/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, note: note.trim() || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      onDone(kind === "cancel" ? (d.requested ? "Cancellation requested. Your order has already shipped, so we're checking with the courier — we'll email you as soon as it's confirmed." : `Order cancelled.${d.refund ? " " + d.refund : ""}`) : "Return requested. We'll email you once it's reviewed.");
    } catch (e2: any) { setErr(e2.message); setBusy(false); }
  };

  return (
    <div className="om-back" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="om" role="dialog" aria-modal="true" aria-labelledby="om-title" onSubmit={submit} noValidate>
        <h2 id="om-title">{kind === "cancel" ? (request ? "Request cancellation" : "Cancel this order?") : "Return this order"}</h2>
        <p>{kind === "cancel" ? (request ? "Your order has already shipped, so we'll ask the courier to stop it and confirm by email. Tell us why." : "Tell us why — it helps us improve. This can't be undone.") : "Tell us what went wrong. Once approved, your refund goes to your original payment method."}</p>
        <label htmlFor="om-reason">Reason</label>
        <select id="om-reason" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus>
          <option value="">Select a reason</option>
          {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <label htmlFor="om-note">More details <small style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>(optional)</small></label>
        <textarea id="om-note" rows={3} maxLength={kind === "cancel" ? 200 : 300} value={note} onChange={(e) => setNote(e.target.value)} />
        {err ? <p role="alert" className="om-err">{err}</p> : null}
        <div className="om-actions">
          <button type="button" className="cv-btn cv-btn-outline" onClick={onClose} disabled={busy}>{request ? "Never mind" : "Keep order"}</button>
          <button type="submit" className="cv-btn cv-btn-navy" disabled={busy}>{busy ? "Please wait…" : kind === "cancel" ? (request ? "Send request" : "Cancel order") : "Request return"}</button>
        </div>
      </form>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"cancel" | "return" | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/orders/${id}?view=customer`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(r.status === 404 ? "We couldn't find that order." : d.error || `HTTP ${r.status}`);
      setOrder(d.order);
      setError(null);
    } catch (e: any) { setError(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // Deep link from the list: ?action=cancel|return opens the dialog once the order has loaded and allows it.
  useEffect(() => {
    const a = search.get("action");
    if (!order || !a) return;
    if (a === "cancel" && order.canCancel.ok) setDialog("cancel");
    if (a === "return" && order.canReturn.ok) setDialog("return");
  }, [order, search]);

  if (error) {
    return (
      <>
        <header className="acct-head"><span className="acct-eyebrow">My account</span><h1 className="acct-title">Order</h1></header>
        <div className="acct-card"><div className="acct-empty"><h3>{error}</h3><Link href="/account/orders" className="cv-btn cv-btn-navy">Back to my orders</Link></div></div>
      </>
    );
  }
  if (!order) return <div className="acct-card"><div className="acct-card-b" style={{ display: "grid", gap: 14 }}>{[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 100 }} />)}</div></div>;

  const st = order.status;
  const label = isOrderStatus(st) ? STATUS_LABEL[st] : st;
  const t = order.tracking;
  const delivered = st === "delivered";
  /** Statuses where the Cancel option is relevant (shown disabled with the reason when it can't be used). */
  const canCancelStatus = ["processing", "confirmed", "shipped", "out_for_delivery"].includes(st);

  return (
    <>
      <header className="acct-head">
        <span className="acct-eyebrow"><Link href="/account/orders" style={{ textDecoration: "underline" }}>← All orders</Link></span>
        <h1 className="acct-title">Order {order.number}</h1>
        <p className="acct-sub">Placed {day(order.createdAt)} · <span className={`acct-chip ${tone(st)}`}>{label}</span></p>
      </header>

      {notice ? <div role="status" className="od-banner warn">{notice}</div> : null}
      {st === "cancelled" ? <div className="od-banner bad">This order was cancelled{order.cancelReason ? ` — ${order.cancelReason}` : ""}.{order.paymentStatus === "refund_pending" ? " Your refund is being processed (5–7 business days)." : order.paymentStatus === "refunded" ? " Your refund has been issued." : ""}</div> : null}
      {order.cancelRequested && st !== "cancelled" ? <div className="od-banner warn">Cancellation requested — we're checking with the courier and will email you once it's confirmed.{order.cancelRequestReason ? ` (${order.cancelRequestReason})` : ""}</div> : null}
      {st === "return_requested" ? <div className="od-banner warn">Return requested — we&apos;ll email you once it&apos;s reviewed.{order.returnReason ? ` (${order.returnReason})` : ""}</div> : null}
      {st === "returned" ? <div className="od-banner">Return complete.{order.paymentStatus === "refunded" ? " Your refund has been issued." : " Your refund is being processed (5–7 business days)."}</div> : null}

      <div className="od-grid">
        <div>
          <section className="od-card" aria-label="Order tracking">
            <h2>Tracking</h2>
            <ol className="ot">
              {order.timeline.map((s, i) => (
                <li key={s.key} className={s.state}>
                  <span className="dot" aria-hidden="true">{s.state === "done" ? "✓" : s.state === "bad" ? "✕" : i + 1}</span>
                  <div>
                    <b>{s.label}</b>
                    <small>{s.at ? when(s.at) : s.state === "todo" ? "Pending" : ""}</small>
                    {s.note && s.state === "bad" ? <small>{s.note}</small> : null}
                  </div>
                </li>
              ))}
            </ol>
            {t.courier || t.number || t.url ? (
              <div className="od-track">
                {t.courier ? <span>Courier: <b>{t.courier}</b></span> : null}
                {t.number ? <span>Tracking no.: <b>{t.number}</b></span> : null}
                {t.url && /^https?:\/\//i.test(t.url) ? <a href={t.url} target="_blank" rel="noopener noreferrer">Track with the courier →</a> : null}
              </div>
            ) : st === "processing" || st === "confirmed" ? <div className="od-track"><span>Tracking details appear here once your order ships.</span></div> : null}
          </section>

          <section className="od-card" aria-label="Items">
            <h2>Items ({order.items.length})</h2>
            <div className="ord-items">
              {order.items.map((it, i) => (
                <div key={i} className="ord-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt="" loading="lazy" />
                  <div style={{ minWidth: 0 }}>
                    <b>{it.title}</b>
                    <small>{[it.size, it.color].filter(Boolean).join(" · ")} · Qty {it.quantity}</small>
                    {delivered || st === "return_requested" || st === "returned" ? <div><Link href={`/products/${slugOf(it)}#reviews`} style={{ fontWeight: 800, fontSize: "0.78rem", textDecoration: "underline", color: "var(--color-navy)" }}>Write a review</Link></div> : null}
                  </div>
                  <span className="ord-price">{inr(it.pricePaise * it.quantity)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="od-card" aria-label="Status history">
            <h2>Updates</h2>
            <ul className="oh">
              {order.history.length === 0 ? <li><b>Order placed</b><small>{when(order.createdAt)}</small></li> : order.history.map((h, i) => (
                <li key={i}><b>{isOrderStatus(h.status) ? STATUS_LABEL[h.status] : h.status}{h.by === "customer" ? " · by you" : ""}</b>{h.note ? <span>{h.note}</span> : null}<br /><small>{when(h.at)}</small></li>
              ))}
            </ul>
          </section>
        </div>

        <div>
          <section className="od-card" aria-label="Actions">
            <h2>Manage</h2>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <a href={`/api/orders/${order.id}/invoice`} className="cv-btn cv-btn-navy" style={{ justifyContent: "center" }}>Download receipt (PDF)</a>
              {order.canCancel.ok ? <button type="button" className="cv-btn cv-btn-outline" onClick={() => setDialog("cancel")}>{order.canCancel.mode === "request" ? "Request cancellation" : "Cancel order"}</button> : canCancelStatus ? <button type="button" className="cv-btn cv-btn-outline" disabled title={order.canCancel.reason}>Cancel order</button> : null}
              {order.canReturn.ok ? <button type="button" className="cv-btn cv-btn-outline" onClick={() => setDialog("return")}>Return / exchange</button> : null}
              {order.canCancel.ok ? <small style={{ font: "600 0.74rem var(--font-sans)", color: "var(--color-smoke)" }}>{order.canCancel.mode === "request" ? "Already shipped — send a cancellation request (" : "You can cancel for "}{order.canCancel.daysLeft} more day{order.canCancel.daysLeft === 1 ? "" : "s"}{order.canCancel.mode === "request" ? " left)." : ", until it ships."}</small> : null}
              {order.canReturn.ok ? <small style={{ font: "600 0.74rem var(--font-sans)", color: "var(--color-smoke)" }}>Returns open for {order.canReturn.daysLeft} more day{order.canReturn.daysLeft === 1 ? "" : "s"}.</small> : null}
              {!order.canCancel.ok && order.canCancel.reason && canCancelStatus ? <small style={{ font: "600 0.74rem var(--font-sans)", color: "var(--color-smoke)" }}>{order.canCancel.reason}</small> : null}
              <a href="mailto:support@cultraven.com?subject=Order%20help" className="cv-btn cv-btn-ghost" style={{ justifyContent: "center" }}>Need help?</a>
            </div>
          </section>

          <section className="od-card" aria-label="Delivery address">
            <h2>Delivering to</h2>
            <p className="od-addr"><b>{order.address.name}</b><br />{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br />{order.address.city}, {order.address.state} {order.address.pincode}<br />Phone: {order.address.phone}</p>
          </section>

          <section className="od-card" aria-label="Payment">
            <h2>Payment</h2>
            <div className="od-row"><span>Method</span><b>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}</b></div>
            <div className="od-row"><span>Status</span><b style={{ textTransform: "capitalize" }}>{order.paymentStatus.replace("_", " ")}</b></div>
            <div className="od-row"><span>Subtotal</span><b>{inr(order.subtotalPaise)}</b></div>
            {order.discountPaise > 0 ? <div className="od-row"><span>Discount</span><b>−{inr(order.discountPaise)}</b></div> : null}
            <div className="od-row"><span>Shipping</span><b>{order.shippingPaise === 0 ? "FREE" : inr(order.shippingPaise)}</b></div>
            {order.codFeePaise > 0 ? <div className="od-row"><span>COD fee</span><b>{inr(order.codFeePaise)}</b></div> : null}
            <div className="od-row total"><span>{order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? "To pay on delivery" : "Total"}</span><b>{inr(order.totalPaise)}</b></div>
          </section>
        </div>
      </div>

      {dialog ? <ReasonDialog kind={dialog} request={dialog === "cancel" && order.canCancel.mode === "request"} orderId={order.id} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); setNotice(m); load(); }} /> : null}
    </>
  );
}
