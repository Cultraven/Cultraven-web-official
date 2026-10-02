"use client";
/**
 * Printable packing slip for one order: ship-to label, what to pack (with tick boxes) and the cash to collect for COD.
 * Opens inside the admin shell; the print stylesheet hides the sidebar/top bar so only the slip prints.
 */
import React, { use, useEffect, useState } from "react";

type Item = { title: string; size?: string; color?: string; quantity: number; pricePaise: number };
type Order = {
  _id: string; items?: Item[]; totalPaise?: number; paymentMethod?: string; paymentStatus?: string; createdAt?: string;
  courierName?: string; trackingNumber?: string;
  deliveryAddress?: { name?: string; phone?: string; email?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
};
const inr = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

export default function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); setOrder(d.order); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p role="alert" style={{ padding: 24 }}>Couldn&apos;t load the order ({error}).</p>;
  if (!order) return <p style={{ padding: 24 }}>Loading…</p>;

  const a = order.deliveryAddress ?? {};
  const cod = order.paymentMethod === "cod" && order.paymentStatus !== "paid";
  const no = `CR-${order._id.slice(-6).toUpperCase()}`;

  return (
    <div className="slip">
      <style>{`
        .slip { max-width: 760px; margin: 0 auto; padding: 8px 0 40px; color: #111; font-family: Arial, Helvetica, sans-serif; }
        .slip h1 { font-size: 22px; margin: 0; letter-spacing: 2px; }
        .slip .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #172554; padding-bottom: 10px; margin-bottom: 14px; gap: 12px; }
        .slip .to { border: 2px solid #111; padding: 14px 16px; margin-bottom: 16px; font-size: 18px; line-height: 1.5; }
        .slip .to small { display: block; font-size: 11px; letter-spacing: 2px; font-weight: 700; margin-bottom: 4px; }
        .slip table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .slip th, .slip td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #bbb; font-size: 14px; }
        .slip .box { display: inline-block; width: 16px; height: 16px; border: 2px solid #111; vertical-align: middle; }
        .slip .cod { border: 3px solid #111; padding: 12px 16px; font-size: 20px; font-weight: 800; margin-bottom: 14px; }
        .slip .actions { margin-bottom: 14px; }
        .slip .actions button { padding: 10px 18px; font-weight: 700; cursor: pointer; }
        @media print {
          .adm-side, .adm-top, .adm-scrim, .actions { display: none !important; }
          .adm-main, .adm-page { margin: 0 !important; padding: 0 !important; max-width: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
      <div className="actions"><button type="button" onClick={() => window.print()}>Print packing slip</button></div>
      <div className="top">
        <div><h1>CULTRAVEN</h1><div style={{ fontSize: 13 }}>Packing slip</div></div>
        <div style={{ textAlign: "right", fontSize: 14 }}><b>Order {no}</b><br />{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}{order.courierName ? <><br />{order.courierName}{order.trackingNumber ? ` · ${order.trackingNumber}` : ""}</> : null}</div>
      </div>
      <div className="to">
        <small>SHIP TO</small>
        <b>{a.name}</b><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />Phone: {a.phone}
      </div>
      {cod ? <div className="cod">COLLECT ON DELIVERY: {inr(order.totalPaise ?? 0)}</div> : <div style={{ marginBottom: 14, fontWeight: 700 }}>PREPAID — do not collect cash</div>}
      <table>
        <thead><tr><th style={{ width: 28 }} /><th>Item</th><th>Size</th><th>Colour</th><th>Qty</th></tr></thead>
        <tbody>
          {(order.items ?? []).map((it, i) => (
            <tr key={i}><td><span className="box" /></td><td>{it.title}</td><td>{it.size}</td><td>{it.color}</td><td><b>{it.quantity}</b></td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 12 }}>Check size and colour against the order before sealing. Thank you!</div>
    </div>
  );
}
