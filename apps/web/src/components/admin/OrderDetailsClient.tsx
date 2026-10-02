"use client";
/**
 * Admin · Order details. Move the order along its workflow (only valid next steps are offered), add courier + tracking,
 * record payment/refund, approve or reject a customer's return, and see the full history. Every status change emails the customer.
 */
import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Field, LinkButton, PageHeader, Skeleton, Switch, inr, useApi, useToast } from "./ui";
import { STATUS_LABEL, isOrderStatus, isBackward, type OrderStatus } from "@/lib/order-lifecycle";

type Item = { productId?: string; title: string; image?: string; size?: string; color?: string; quantity: number; pricePaise: number };
type Address = { line1?: string; line2?: string; name?: string; email?: string; phone?: string; city?: string; state?: string; pincode?: string };
type Event = { status: string; note?: string; at: string; by?: string };
type Order = {
  _id: string; razorpayOrderId?: string; razorpayPaymentId?: string; items?: Item[];
  subtotalPaise?: number; discountPaise?: number; shippingPaise?: number; codFeePaise?: number; totalPaise?: number;
  deliveryAddress?: Address; paymentMethod?: string; paymentStatus?: string; fulfillmentStatus?: string; createdAt?: string;
  deliveredAt?: string | null; courierName?: string; trackingNumber?: string; trackingUrl?: string;
  cancelReason?: string; returnReason?: string; cancelRequestedAt?: string | null; cancelRequestReason?: string; statusHistory?: Event[]; allowedNext?: OrderStatus[];
};

const TONES: Record<string, "warn" | "info" | "success" | "danger" | "neutral"> = { processing: "warn", confirmed: "info", shipped: "info", out_for_delivery: "info", delivered: "success", cancelled: "danger", return_requested: "warn", returned: "danger" };
const label = (s?: string) => (s && isOrderStatus(s) ? STATUS_LABEL[s] : s ? s.replace(/_/g, " ") : "—");
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");
const fmt = (d?: string) => (d ? new Date(d).toLocaleString("en-IN") : "");

function Line({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="adm-actions" style={{ justifyContent: "space-between", padding: "4px 0", fontWeight: strong ? 700 : 400 }}>
      <span className={strong ? undefined : "adm-cell-sub"}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

/** Button text for each next status. */
const ACTION: Record<string, string> = { confirmed: "Confirm order", shipped: "Mark shipped", out_for_delivery: "Out for delivery", delivered: "Mark delivered", cancelled: "Cancel order", returned: "Approve return / refund" };

export default function OrderDetailsClient({ id }: { id: string }) {
  const { data, error, loading, reload, setData } = useApi<{ order: Order }>(`/api/orders/${id}`);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [fixTo, setFixTo] = useState("");
  const [courier, setCourier] = useState("");
  const [tno, setTno] = useState("");
  const [turl, setTurl] = useState("");
  const order = data?.order;

  useEffect(() => {
    if (order) { setCourier(order.courierName ?? ""); setTno(order.trackingNumber ?? ""); setTurl(order.trackingUrl ?? ""); }
  }, [order?._id, order?.courierName, order?.trackingNumber, order?.trackingUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(body: Record<string, unknown>, okMsg: string) {
    setSaving(true);
    try {
      const r = await fetch(`/api/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setData({ order: j.order });
      setNote("");
      toast(okMsg);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update", "error");
      reload();
    } finally {
      setSaving(false);
    }
  }

  const back = <LinkButton href="/portal-secure/orders" variant="ghost" icon="chevron">Back to orders</LinkButton>;

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Loading order…">{back}</PageHeader>
        <div className="adm-grid adm-grid-main"><Card><Skeleton h={180} /></Card><Card><Skeleton h={180} /></Card></div>
      </>
    );
  }
  if (error || !order) {
    const notFound = error === "Order not found";
    return (
      <>
        <PageHeader title={notFound ? "Order not found" : "Order"}>{back}</PageHeader>
        {notFound || !error ? <Card><EmptyState title="Order not found" description="It may have been removed or the link is incorrect." /></Card> : <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert>}
      </>
    );
  }

  const status = (order.fulfillmentStatus || "processing").toLowerCase();
  const a = order.deliveryAddress ?? {};
  const items = order.items ?? [];
  const subtotal = order.subtotalPaise ?? items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const title = `CR-${order._id.slice(-6).toUpperCase()}`;
  const addr = [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.pincode].filter(Boolean);
  const next = order.allowedNext ?? [];
  const forward = next.filter((to) => !isBackward(status, to));
  const undoable = next.filter((to) => isBackward(status, to));
  const needsNote = (to: string) => to === "cancelled" || (status === "return_requested" && to === "delivered");
  const finished = next.length === 0;
  const trackingDirty = courier !== (order.courierName ?? "") || tno !== (order.trackingNumber ?? "") || turl !== (order.trackingUrl ?? "");
  const refundDue = order.paymentStatus === "refund_pending";

  return (
    <>
      <PageHeader title={`Order ${title}`} description={order.createdAt ? `Placed ${new Date(order.createdAt).toLocaleString("en-IN")}${order.razorpayOrderId ? ` · ${order.razorpayOrderId}` : ""}` : undefined}>
        {back}
        <Badge tone={TONES[status] ?? "neutral"}>{label(status)}</Badge>
        <LinkButton href={`/api/orders/${id}/invoice`} external>Receipt PDF</LinkButton>
      </PageHeader>

      {status === "return_requested" ? <div style={{ marginBottom: 14 }}><Alert kind="info"><b>Return requested</b> — {order.returnReason || "no reason given"}. Approve to refund, or reject with a note.</Alert></div> : null}
      {order.cancelRequestedAt && status !== "cancelled" ? (
        <div style={{ marginBottom: 14 }}>
          <Alert kind="info">
            <span><b>Customer asked to cancel</b> (already {label(status).toLowerCase()}) — {order.cancelRequestReason || "no reason given"}. </span>
            <Button size="sm" variant="danger" disabled={saving} onClick={() => send({ fulfillmentStatus: "cancelled", note: `Cancelled at your request${order.cancelRequestReason ? `: ${order.cancelRequestReason}` : ""}` }, "Order cancelled · customer notified")}>Approve cancellation</Button>
          </Alert>
        </div>
      ) : null}
      {refundDue ? <div style={{ marginBottom: 14 }}><Alert kind="info"><b>Refund due</b> — {inr(order.totalPaise ?? 0)} paid online. Refund it in your Razorpay dashboard, then mark payment as refunded below.</Alert></div> : null}

      <div className="adm-grid adm-grid-main">
        <div className="adm-list">
          <Card title="Update order">
            {finished ? (
              <p className="adm-cell-sub">This order is {label(status).toLowerCase()} — no further status changes.</p>
            ) : (
              <>
                <Field label={`Note to customer ${forward.some(needsNote) ? "(required to cancel / reject a return)" : "(optional)"}`}>
                  <input className="adm-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Shown in their email and order page" />
                </Field>
                <div className="adm-actions" style={{ marginTop: 12 }}>
                  {forward.map((to) => {
                    const reject = status === "return_requested" && to === "delivered";
                    const danger = to === "cancelled" || reject;
                    return (
                      <Button key={to} variant={danger ? "danger" : to === "delivered" || to === "returned" ? "primary" : "default"} disabled={saving || (needsNote(to) && !note.trim())} loading={saving} onClick={() => send({ fulfillmentStatus: to, note: note.trim() || undefined, notify: emailCustomer }, `Order ${reject ? "return rejected" : label(to).toLowerCase()}${emailCustomer ? " · customer notified" : ""}`)}>
                        {reject ? "Reject return" : ACTION[to] ?? cap(to)}
                      </Button>
                    );
                  })}
                </div>
                <label className="adm-row" style={{ marginTop: 14, cursor: "pointer" }}>
                  <span className="adm-row-main"><b>Email the customer about this change</b><span className="adm-cell-sub" style={{ display: "block" }}>Sends the status update (and tracking) to {a.email || "the customer"}.</span></span>
                  <Switch checked={emailCustomer} onChange={setEmailCustomer} label="Email the customer" />
                </label>
                {undoable.length > 0 ? (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--a-border)" }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Clicked the wrong status?</div>
                    <div className="adm-actions">
                      <select className="adm-select" style={{ maxWidth: 260 }} aria-label="Move order back to" value={fixTo} onChange={(e) => setFixTo(e.target.value)}>
                        <option value="">Move back to…</option>
                        {undoable.map((to) => <option key={to} value={to}>{label(to)}</option>)}
                      </select>
                      <Button disabled={saving || !fixTo} onClick={() => send({ fulfillmentStatus: fixTo, notify: false }, `Order moved back to ${label(fixTo).toLowerCase()}`).then(() => setFixTo(""))}>Apply correction</Button>
                    </div>
                    <div className="adm-cell-sub" style={{ marginTop: 4 }}>Fixes a mis-click. The customer is not emailed.</div>
                  </div>
                ) : null}
              </>
            )}
          </Card>

          <Card title="Courier & tracking">
            <div className="adm-grid adm-grid-2">
              <Field label="Courier"><input className="adm-input" value={courier} maxLength={60} onChange={(e) => setCourier(e.target.value)} placeholder="Delhivery, Blue Dart…" /></Field>
              <Field label="Tracking number"><input className="adm-input" value={tno} maxLength={60} onChange={(e) => setTno(e.target.value)} /></Field>
              <Field label="Tracking link" span><input className="adm-input" value={turl} maxLength={300} onChange={(e) => setTurl(e.target.value)} placeholder="https://…" /></Field>
            </div>
            <div className="adm-actions" style={{ marginTop: 12 }}>
              <Button variant="primary" disabled={saving || !trackingDirty} loading={saving} onClick={() => send({ courierName: courier.trim(), trackingNumber: tno.trim(), trackingUrl: turl.trim() }, "Tracking saved · customer notified")}>Save tracking</Button>
            </div>
          </Card>

          <Card title={`Items (${items.length})`} pad={false}>
            {items.length === 0 ? <EmptyState title="No items" /> : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col" className="num">Price</th></tr></thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={`${it.productId ?? it.title}-${i}`}>
                        <td>
                          <div className="adm-cell-media">
                            {it.image ? <img className="adm-thumb" src={it.image} alt="" loading="lazy" /> : <div className="adm-thumb" />}
                            <div><div className="adm-cell-title">{it.title}</div><div className="adm-cell-sub">{[it.size && `Size ${it.size}`, it.color].filter(Boolean).join(" · ")}</div></div>
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

          <Card title="History">
            {(order.statusHistory ?? []).length === 0 ? <p className="adm-cell-sub">No updates yet.</p> : (
              <div className="adm-list">
                {[...(order.statusHistory ?? [])].reverse().map((h, i) => (
                  <div key={i} style={{ borderLeft: "3px solid var(--a-border)", paddingLeft: 10 }}>
                    <div style={{ fontWeight: 600 }}>{label(h.status)} <span className="adm-cell-sub">· {h.by ?? "system"}</span></div>
                    {h.note ? <div>{h.note}</div> : null}
                    <div className="adm-cell-sub">{fmt(h.at)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

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
            <Line k="Status" v={<Badge tone={order.paymentStatus === "paid" ? "success" : refundDue ? "warn" : order.paymentStatus === "refunded" ? "neutral" : "warn"}>{cap(order.paymentStatus)}</Badge>} />
            {order.razorpayPaymentId ? <Line k="Payment ID" v={<span style={{ fontSize: 12 }}>{order.razorpayPaymentId}</span>} /> : null}
            <Line k="Subtotal" v={inr(subtotal)} />
            {order.discountPaise ? <Line k="Discount" v={`− ${inr(order.discountPaise)}`} /> : null}
            <Line k="Shipping" v={order.shippingPaise ? inr(order.shippingPaise) : "Free"} />
            {order.codFeePaise ? <Line k="COD fee" v={inr(order.codFeePaise)} /> : null}
            <Line k="Total" v={inr(order.totalPaise ?? 0)} strong />
            <div className="adm-actions" style={{ marginTop: 12 }}>
              {order.paymentStatus === "pending" && order.paymentMethod === "cod" ? <Button size="sm" disabled={saving} onClick={() => send({ paymentStatus: "paid" }, "Marked paid")}>Mark COD cash received</Button> : null}
              {refundDue ? <Button size="sm" variant="primary" disabled={saving} onClick={() => send({ paymentStatus: "refunded", note: "Refund issued" }, "Marked refunded")}>Mark refunded</Button> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
