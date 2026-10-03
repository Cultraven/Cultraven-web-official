"use client";
import React, { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "@/components/admin/admin.css";
import { Badge, Button, Card, EmptyState, Icon, TableSkeleton, useApi } from "@/components/admin/ui";

type Address = { name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string };
type OrderItem = { title: string; size: string; color: string; quantity: number };
type DeliveryOrder = {
  id: string; orderNumber: string; items: OrderItem[];
  totalPaise: number; fulfillmentStatus: string; paymentMethod: string;
  address: Address; createdAt: string;
};

const STATUS_TONES: Record<string, "success" | "danger" | "warn" | "info" | "neutral"> = {
  confirmed: "info", packed: "info", on_hold: "warn", shipped: "info",
  out_for_delivery: "warn", delivery_failed: "danger",
};
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";
const fmtINR = (p: number) => "₹" + (p / 100).toLocaleString("en-IN");
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_NEXT: Record<string, { label: string; status: string; tone: "success" | "danger" | "info" }[]> = {
  confirmed:         [{ label: "Mark Out for Delivery", status: "out_for_delivery", tone: "info" }],
  packed:            [{ label: "Mark Out for Delivery", status: "out_for_delivery", tone: "info" }],
  on_hold:           [{ label: "Mark Out for Delivery", status: "out_for_delivery", tone: "info" }],
  shipped:           [{ label: "Mark Out for Delivery", status: "out_for_delivery", tone: "info" }],
  out_for_delivery:  [
    { label: "Mark Delivered ✓", status: "delivered", tone: "success" },
    { label: "Mark Failed", status: "delivery_failed", tone: "danger" },
  ],
  delivery_failed:   [{ label: "Retry Delivery", status: "out_for_delivery", tone: "info" }],
};

function OrderCard({ order, onStatusChange }: { order: DeliveryOrder; onStatusChange: (id: string, status: string) => Promise<void> }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const actions = STATUS_NEXT[order.fulfillmentStatus] ?? [];

  const handleStatus = async (status: string) => {
    setUpdating(status);
    await onStatusChange(order.id, status);
    setUpdating(null);
  };

  return (
    <div style={{ background: "var(--adm-surface)", border: "2px solid var(--adm-border)", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, fontSize: "15px", fontFamily: "monospace" }}>{order.orderNumber}</span>
        <Badge tone={STATUS_TONES[order.fulfillmentStatus] ?? "neutral"}>{cap(order.fulfillmentStatus)}</Badge>
        <span style={{ fontSize: "12px", color: "var(--adm-muted)", marginLeft: "auto" }}>{fmtDate(order.createdAt)}</span>
      </div>

      {/* Customer */}
      <div style={{ background: "var(--adm-bg)", borderRadius: 6, padding: "10px 12px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{order.address.name}</div>
        <div style={{ fontSize: "13px", color: "var(--adm-muted)", lineHeight: 1.5 }}>
          {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}
          <br />{order.address.city}, {order.address.state} — {order.address.pincode}
        </div>
        <div style={{ marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href={`tel:${order.address.phone}`} style={{ fontSize: "13px", fontWeight: 700, color: "var(--adm-text)", textDecoration: "none" }}>
            📞 {order.address.phone}
          </a>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(`${order.address.line1}, ${order.address.city}, ${order.address.pincode}`)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "13px", color: "var(--adm-muted)", textDecoration: "underline" }}>
            📍 Open in Maps
          </a>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ fontSize: "13px", display: "flex", gap: "8px" }}>
            <span style={{ fontWeight: 600, color: "var(--adm-muted)", minWidth: "22px" }}>×{item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{item.title}</span>
            <span style={{ color: "var(--adm-muted)" }}>{item.size}{item.color ? ` · ${item.color}` : ""}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--adm-border)" }}>
        <span style={{ fontSize: "12px", color: "var(--adm-muted)" }}>
          {order.paymentMethod === "cod" ? "💵 Cash on delivery" : "✅ Paid online"} · {fmtINR(order.totalPaise)}
        </span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {actions.map((a) => (
            <button
              key={a.status}
              disabled={!!updating}
              onClick={() => handleStatus(a.status)}
              style={{
                padding: "8px 14px", fontWeight: 700, fontSize: "12px", border: "2px solid currentColor", borderRadius: 4, cursor: "pointer",
                background: a.tone === "success" ? "#16a34a" : a.tone === "danger" ? "#dc2626" : "#2563eb",
                color: "#fff", opacity: updating ? 0.6 : 1,
              }}
            >
              {updating === a.status ? "Updating…" : a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPortal() {
  const { data, loading, error, reload } = useApi<{ orders: DeliveryOrder[] }>("/api/delivery/orders");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const dq = useDeferredValue(query);

  const orders = data?.orders ?? [];
  const filtered = useMemo(() => {
    const q = dq.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.address.name.toLowerCase().includes(q) ||
      o.address.phone.includes(q) ||
      o.address.city.toLowerCase().includes(q)
    );
  }, [orders, dq]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/delivery/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      showToast(`Status updated to ${cap(status)}`, true);
      reload();
    } catch (e: any) {
      showToast(e.message ?? "Failed to update status", false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/delivery-logout", { method: "POST" });
    router.push("/portal-delivery-access");
  };

  return (
    <div className="adm" style={{ minHeight: "100vh", background: "var(--adm-bg)" }}>
      {/* Toast */}
      {toast ? (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff", padding: "10px 16px", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
          {toast.msg}
        </div>
      ) : null}

      {/* Header */}
      <div style={{ background: "var(--adm-surface)", borderBottom: "2px solid var(--adm-border)", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ fontWeight: 800, letterSpacing: "0.15em", fontSize: 14 }}>CULTRAVEN</div>
        <div style={{ fontSize: 12, color: "var(--adm-muted)", fontWeight: 700 }}>Delivery Portal</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--adm-muted)" }}>{orders.length} active orders</span>
          <button onClick={logout} style={{ fontSize: 12, fontWeight: 700, color: "var(--adm-muted)", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Icon name="search" size={16} />
          <input
            className="adm-input"
            type="search"
            placeholder="Search order, customer name, phone, city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: "36px" }}
          />
        </div>

        {error ? (
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px", borderRadius: 6, marginBottom: 16 }}>
            {error} <button onClick={reload} style={{ marginLeft: 8, fontWeight: 700, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>Retry</button>
          </div>
        ) : null}

        {loading && !data ? (
          <TableSkeleton rows={4} cols={1} />
        ) : filtered.length === 0 ? (
          <Card pad>
            <EmptyState title="No active orders" description={orders.length === 0 ? "No orders pending delivery." : "No orders match your search."} />
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
