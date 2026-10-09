"use client";
/**
 * Admin · Order details. Move the order along its workflow (only valid next steps are offered, grouped into
 * "move forward" and "something went wrong"), add courier + tracking, record payment/refund, approve or reject a
 * customer's return, keep private team notes, resend the confirmation email and print a packing slip.
 * Every customer-visible status change emails the customer (switchable per change).
 */
import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Field, LinkButton, PageHeader, Skeleton, Switch, inr, useApi, useConfirm, useToast } from "./ui";
import { STATUS_LABEL, TRACKING_STAGES, isOrderStatus, isBackward, type OrderStatus } from "@/lib/order-lifecycle";

type Item = { productId?: string; title: string; image?: string; size?: string; color?: string; quantity: number; pricePaise: number };
type Address = { line1?: string; line2?: string; name?: string; email?: string; phone?: string; city?: string; state?: string; pincode?: string };
type Event = { status: string; note?: string; at: string; by?: string };
type Order = {
  _id: string; razorpayOrderId?: string; razorpayPaymentId?: string; items?: Item[];
  subtotalPaise?: number; discountPaise?: number; shippingPaise?: number; codFeePaise?: number; totalPaise?: number;
  deliveryAddress?: Address; paymentMethod?: string; paymentStatus?: string; fulfillmentStatus?: string; createdAt?: string;
  deliveredAt?: string | null; courierName?: string; trackingNumber?: string; trackingUrl?: string;
  cancelReason?: string; returnReason?: string; cancelRequestedAt?: string | null; cancelRequestReason?: string;
  statusHistory?: Event[]; adminNotes?: { text: string; at: string }[]; allowedNext?: OrderStatus[];
};

const TONES: Record<string, "warn" | "info" | "success" | "danger" | "neutral"> = {
  processing: "warn", confirmed: "info", packed: "info", on_hold: "warn", shipped: "info", out_for_delivery: "info",
  delivery_failed: "warn", delivered: "success", cancelled: "danger", rto: "danger", return_requested: "warn", returned: "danger",
};
const label = (s?: string) => (s && isOrderStatus(s) ? STATUS_LABEL[s] : s ? s.replace(/_/g, " ") : "—");
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—");
const fmt = (d?: string) => (d ? new Date(d).toLocaleString("en-IN") : "");

type Feedback = { id: string; productId: string; name: string; rating: number; title?: string; comment: string; size?: string; createdAt: string };

/** The reviews customers wrote for this order. An admin can remove any of them (this also refreshes the product's star rating). */
function OrderFeedback({ orderId, items }: { orderId: string; items: Item[] }) {
  const { data, error, loading, reload, setData } = useApi<{ reviews: Feedback[] }>(`/api/orders/${orderId}/feedback`);
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);
  const reviews = data?.reviews ?? [];
  const productOf = (pid: string) => items.find((i) => i.productId === pid)?.title ?? "this order";

  async function remove(r: Feedback) {
    const ok = await confirm({
      title: "Delete this feedback?",
      message: `${r.name}'s ${r.rating}-star review will be removed from the product page and the product's rating will be recalculated. This can't be undone.`,
      confirmLabel: "Delete feedback",
      danger: true,
    });
    if (!ok) return;
    setBusy(r.id);
    try {
      const res = await fetch(`/api/reviews/${r.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setData({ reviews: reviews.filter((x) => x.id !== r.id) });
      toast("Feedback deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete the feedback", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title={`Customer feedback${data ? ` (${reviews.length})` : ""}`}>
      {loading && !data ? (
        <Skeleton h={60} />
      ) : error ? (
        <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert>
      ) : reviews.length === 0 ? (
        <p className="adm-cell-sub">No feedback has been left for this order yet.</p>
      ) : (
        <div className="adm-list">
          {reviews.map((r) => (
            <div key={r.id} style={{ borderLeft: "3px solid var(--a-border)", paddingLeft: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>
                  <span role="img" aria-label={`${r.rating} out of 5 stars`} style={{ color: "var(--a-accent)", letterSpacing: 1 }}>{"★".repeat(r.rating)}{"☆".repeat(Math.max(0, 5 - r.rating))}</span>
                  {r.title ? <span> {r.title}</span> : null}
                </div>
                <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{r.comment}</div>
                <div className="adm-cell-sub">{r.name} · {productOf(r.productId)}{r.size ? ` (size ${r.size})` : ""} · {fmt(r.createdAt)}</div>
              </div>
              <Button size="sm" variant="danger" loading={busy === r.id} disabled={!!busy} onClick={() => remove(r)}>Delete</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Line({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="adm-actions" style={{ justifyContent: "space-between", padding: "4px 0", fontWeight: strong ? 700 : 400 }}>
      <span className={strong ? undefined : "adm-cell-sub"}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

/**
 * Button / toast text for a move. The stage names are exactly the ones customers see in order tracking (STATUS_LABEL);
 * cancelling and deciding a return request are the only other actions and have their own buttons.
 */
function actionLabel(from: string, to: string): string {
  if (from === "return_requested" && to === "delivered") return "Reject return";
  if (to === "returned") return "Approve return & refund";
  if (to === "cancelled") return "Cancel order";
  return `Mark as ${label(to)}`;
}

export default function OrderDetailsClient({ id }: { id: string }) {
  const { data, error, loading, reload, setData } = useApi<{ order: Order }>(`/api/orders/${id}`);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [team, setTeam] = useState("");
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [courier, setCourier] = useState("");
  const [tno, setTno] = useState("");
  const [turl, setTurl] = useState("");
  const [resending, setResending] = useState(false);
  const order = data?.order;

  useEffect(() => {
    if (order) { setCourier(order.courierName ?? ""); setTno(order.trackingNumber ?? ""); setTurl(order.trackingUrl ?? ""); }
  }, [order?._id, order?.courierName, order?.trackingNumber, order?.trackingUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(body: Record<string, unknown>, okMsg: string): Promise<boolean> {
    setSaving(true);
    try {
      const r = await fetch(`/api/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setData({ order: j.order });
      toast(okMsg);
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update", "error");
      reload();
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const r = await fetch(`/api/orders/${id}/resend`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      toast("Confirmation email sent again");
    } catch (e) { toast(e instanceof Error ? e.message : "Could not send", "error"); }
    finally { setResending(false); }
  }

  const back = <LinkButton href="/portal-secure/orders" variant="ghost" icon="back">Back to orders</LinkButton>;

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
  const inReturn = status === "return_requested";
  // The status menu and "move forward" buttons offer ONLY the steps the customer sees in tracking (same names, same order).
  const stageNext = inReturn ? [] : TRACKING_STAGES.filter((s) => s !== status && next.includes(s));
  const forward = stageNext.filter((s) => !isBackward(status, s));
  const goBack = stageNext.filter((s) => isBackward(status, s));
  const canCancel = next.includes("cancelled");
  const canApproveReturn = inReturn && next.includes("returned");
  const rejectReturn = inReturn && next.includes("delivered");
  const needsNote = (to: string) => to === "cancelled" || (status === "return_requested" && to === "delivered");
  const finished = next.length === 0;
  const hasActions = forward.length > 0 || canCancel || canApproveReturn || rejectReturn;
  const trackingDirty = courier !== (order.courierName ?? "") || tno !== (order.trackingNumber ?? "") || turl !== (order.trackingUrl ?? "");
  const refundDue = order.paymentStatus === "refund_pending";

  /** Apply a status move (notes enforced where required). */
  const move = (to: string) => {
    if (needsNote(to) && !note.trim()) {
      toast("Add a note for the customer first (required to cancel or reject a return).", "error");
      document.getElementById("order-note")?.focus();
      return;
    }
    const undo = isBackward(status, to);
    send({ fulfillmentStatus: to, note: note.trim() || undefined, notify: undo ? false : emailCustomer }, `${actionLabel(status, to).replace("↩ ", "")}${!undo && emailCustomer ? " · customer notified" : ""}`).then((ok) => ok && setNote(""));
  };

  const btn = (to: string, variant: "default" | "primary" | "danger") => (
    <Button key={to} variant={variant} disabled={saving || (needsNote(to) && !note.trim())} loading={saving} onClick={() => move(to)}>{actionLabel(status, to)}</Button>
  );

  return (
    <>
      <PageHeader title={`Order ${title}`} description={order.createdAt ? `Placed ${new Date(order.createdAt).toLocaleString("en-IN")}${order.razorpayOrderId ? ` · ${order.razorpayOrderId}` : ""}` : undefined}>
        {back}
        <Badge tone={TONES[status] ?? "neutral"}>{label(status)}</Badge>
        <select
          className="adm-select"
          style={{ width: 210 }}
          aria-label="Change order status"
          value=""
          disabled={saving || stageNext.length === 0}
          onChange={(e) => { const to = e.target.value; e.target.value = ""; if (to) move(to); }}
        >
          <option value="">{stageNext.length ? "Change status…" : finished ? "No further changes" : "Use the buttons below"}</option>
          {forward.length ? <optgroup label="Move forward">{forward.map((s) => <option key={s} value={s}>{label(s)}</option>)}</optgroup> : null}
          {goBack.length ? <optgroup label="Go back (customer not emailed)">{goBack.map((s) => <option key={s} value={s}>{label(s)}</option>)}</optgroup> : null}
        </select>
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
      {status === "delivery_failed" ? <div style={{ marginBottom: 14 }}><Alert kind="info"><b>Delivery attempt failed.</b> Pick the next stage from the status menu, or cancel the order if the customer can&apos;t be reached.</Alert></div> : null}
      {refundDue ? <div style={{ marginBottom: 14 }}><Alert kind="info"><b>Refund due</b> — {inr(order.totalPaise ?? 0)} paid online. Refund it in your Razorpay dashboard, then mark payment as refunded below.</Alert></div> : null}

      <div className="adm-grid adm-grid-main">
        <div className="adm-list">
          <Card title="Update order">
            {finished ? (
              <p className="adm-cell-sub">This order is {label(status).toLowerCase()} — no further status changes.</p>
            ) : !hasActions ? (
              <p className="adm-cell-sub">Nothing more to do here — this order is {label(status).toLowerCase()}. If a stage was set by mistake, choose the right one in the status menu at the top (going back doesn&apos;t email the customer).</p>
            ) : (
              <>
                <Field label={`Note to customer ${canCancel || rejectReturn ? "(required to cancel / reject a return)" : "(optional)"}`}>
                  <input id="order-note" className="adm-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Shown in their email and order page" />
                </Field>

                {forward.length > 0 ? (
                  <>
                    <div className="adm-cell-sub" style={{ margin: "14px 0 6px", fontWeight: 600 }}>Move forward</div>
                    <div className="adm-actions">{forward.map((to) => btn(to, to === "delivered" ? "primary" : "default"))}</div>
                  </>
                ) : null}
                {canApproveReturn || rejectReturn ? (
                  <>
                    <div className="adm-cell-sub" style={{ margin: "14px 0 6px", fontWeight: 600 }}>Customer&apos;s return request</div>
                    <div className="adm-actions">
                      {canApproveReturn ? btn("returned", "primary") : null}
                      {rejectReturn ? btn("delivered", "danger") : null}
                    </div>
                  </>
                ) : null}
                {canCancel ? (
                  <>
                    <div className="adm-cell-sub" style={{ margin: "14px 0 6px", fontWeight: 600 }}>Need to stop this order?</div>
                    <div className="adm-actions">{btn("cancelled", "danger")}</div>
                  </>
                ) : null}

                <label className="adm-row" style={{ marginTop: 16, cursor: "pointer" }}>
                  <span className="adm-row-main"><b>Email the customer about this change</b><span className="adm-cell-sub" style={{ display: "block" }}>Sends the status update (and tracking) to {a.email || "the customer"}.</span></span>
                  <Switch checked={emailCustomer} onChange={setEmailCustomer} label="Email the customer" />
                </label>
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
              <Button variant="primary" disabled={saving || !trackingDirty} loading={saving} onClick={() => send({ courierName: courier.trim(), trackingNumber: tno.trim(), trackingUrl: turl.trim(), notify: emailCustomer }, `Tracking saved${emailCustomer ? " · customer notified" : ""}`)}>Save tracking</Button>
            </div>
          </Card>

          <Card title="More actions">
            <div className="adm-actions">
              <Button loading={resending} onClick={resend}>Resend confirmation email</Button>
              <LinkButton href={`/portal-secure/orders/${id}/print`} external>Print packing slip</LinkButton>
              <LinkButton href={`/api/orders/${id}/invoice`} external>Download receipt</LinkButton>
              {order.paymentStatus === "pending" && order.paymentMethod === "cod" ? <Button disabled={saving} onClick={() => send({ paymentStatus: "paid" }, "Marked paid")}>Mark COD cash received</Button> : null}
              {a.email ? <LinkButton href={`mailto:${a.email}?subject=${encodeURIComponent(`Your CULTRAVEN order ${title}`)}`} external>Email customer</LinkButton> : null}
              {a.phone ? <LinkButton href={`tel:${a.phone}`} external>Call customer</LinkButton> : null}
            </div>
          </Card>

          <Card title="Team notes (private)">
            <p className="adm-cell-sub" style={{ marginBottom: 8 }}>Only your team sees these. They are never shown or emailed to the customer.</p>
            <div className="adm-actions">
              <input className="adm-input" style={{ flex: 1, minWidth: 220 }} value={team} maxLength={500} onChange={(e) => setTeam(e.target.value)} placeholder="e.g. Customer called, will collect from courier hub" aria-label="Private note" />
              <Button disabled={saving || !team.trim()} onClick={() => send({ internalNote: team.trim() }, "Private note saved").then((ok) => ok && setTeam(""))}>Save note</Button>
            </div>
            {(order.adminNotes ?? []).length ? (
              <div className="adm-list" style={{ marginTop: 12 }}>
                {[...(order.adminNotes ?? [])].reverse().map((n, i) => (
                  <div key={i} style={{ borderLeft: "3px solid var(--a-border)", paddingLeft: 10 }}>
                    <div>{n.text}</div>
                    <div className="adm-cell-sub">{fmt(n.at)}</div>
                  </div>
                ))}
              </div>
            ) : null}
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

          <OrderFeedback orderId={id} items={items} />

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
              {refundDue ? <Button size="sm" variant="primary" disabled={saving} onClick={() => send({ paymentStatus: "refunded", note: "Refund issued" }, "Marked refunded")}>Mark refunded</Button> : null}
              {order.paymentStatus === "paid" && order.paymentMethod === "cod" && !refundDue ? <Button size="sm" disabled={saving} onClick={() => send({ paymentStatus: "pending" }, "Marked unpaid")}>Mark unpaid</Button> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
