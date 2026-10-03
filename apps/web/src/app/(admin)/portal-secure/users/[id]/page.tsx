"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert, Badge, Button, Card, EmptyState, Field, Icon, LinkButton,
  PageHeader, TableSkeleton, useApi, useConfirm, useToast,
} from "@/components/admin/ui";

type User = {
  id: string; fullName: string; firstName: string; lastName: string;
  email: string; phone: string | null; role: string; status: string;
  emailVerified: boolean; avatarUpdatedAt: string | null;
  createdAt: string; updatedAt: string; deletedAt: string | null;
};
type Stats = { orderCount: number; orderTotalPaise: number };
type Order = { id: string; totalPaise: number; status: string; createdAt: string };
type EmailLog = { id: string; kind: string; subject: string; status: string; error: string; orderId: string; createdAt: string };
type Detail = { user: User; stats: Stats; recentOrders: Order[]; emailLogs: EmailLog[] };

const STATUS_TONES: Record<string, "success" | "danger" | "warn" | "neutral" | "info"> = {
  sent: "success", failed: "danger", skipped: "warn",
  active: "success", deleted: "danger",
  processing: "warn", confirmed: "info", shipped: "info",
  delivered: "success", cancelled: "danger",
};

function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtINR(paise: number) {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—"; }

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi<Detail>(`/api/admin/users/${id}`);
  const { toast } = useToast();
  const confirm = useConfirm();

  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const user = data?.user;
  const stats = data?.stats;

  const changePassword = async () => {
    if (newPw.trim().length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    const ok = await confirm({ title: `Change password for ${user?.fullName}?`, message: "A new bcrypt hash will be saved. The old password will stop working immediately.", confirmLabel: "Update password" });
    if (!ok) return;
    setPwLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      toast("Password updated", "success");
      setNewPw("");
    } catch (e: any) {
      toast(e.message ?? "Failed to update password", "error");
    } finally { setPwLoading(false); }
  };

  const toggleStatus = async () => {
    if (!user) return;
    const next = user.status === "active" ? "deleted" : "active";
    const ok = await confirm({ title: `${next === "deleted" ? "Deactivate" : "Reactivate"} account?`, message: `This will ${next === "deleted" ? "block login access for" : "restore login access for"} ${user.fullName}.`, danger: next === "deleted" });
    if (!ok) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      toast(`Account ${next === "deleted" ? "deactivated" : "reactivated"}`, "success");
      reload();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally { setStatusLoading(false); }
  };

  if (loading && !data) return <TableSkeleton rows={6} cols={4} />;
  if (error) return <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert>;
  if (!user) return null;

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title={user.fullName}
        description={user.email}
      >
        <LinkButton href="/portal-secure/users" size="sm"><Icon name="chevron" size={14} /> Back to users</LinkButton>
      </PageHeader>

      {/* ── Summary stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Orders", value: stats?.orderCount ?? 0 },
          { label: "Total spent", value: stats ? fmtINR(stats.orderTotalPaise) : "—" },
          { label: "Role", value: cap(user.role) },
          { label: "Status", value: cap(user.status) },
        ].map((s) => (
          <Card key={s.label} pad>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--adm-muted)", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--adm-text)" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* ── Profile ── */}
        <Card pad>
          <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Profile</div>
          <div style={{ display: "grid", gap: "10px" }}>
            {[
              ["First name", user.firstName],
              ["Last name", user.lastName],
              ["Email", user.email],
              ["Phone", user.phone ?? "—"],
              ["Role", cap(user.role)],
              ["Status", cap(user.status)],
              ["Email verified", user.emailVerified ? "Yes" : "No"],
              ["Joined", fmtDate(user.createdAt)],
              ["Last updated", fmtDate(user.updatedAt)],
              user.deletedAt ? ["Deleted at", fmtDate(user.deletedAt)] : null,
            ].filter((x): x is [string, string] => x !== null).map(([label, value]) => (
              <div key={label as string} style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--adm-muted)", minWidth: "110px", flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: "13px", color: "var(--adm-text)", wordBreak: "break-all" }}>{value as string}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card pad>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Change Password</div>
            <p style={{ fontSize: "12px", color: "var(--adm-muted)", marginBottom: "12px" }}>
              Set a new password for this account. The password is stored as a bcrypt hash — the original is never saved.
            </p>
            <Field label="New password">
              <input
                type="password"
                className="adm-input"
                placeholder="Min. 8 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                style={{ width: "100%" }}
              />
            </Field>
            <div style={{ marginTop: "12px" }}>
              <Button onClick={changePassword} loading={pwLoading} disabled={newPw.trim().length < 8}>
                Update password
              </Button>
            </div>
          </Card>

          <Card pad>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Account Status</div>
            <p style={{ fontSize: "12px", color: "var(--adm-muted)", marginBottom: "12px" }}>
              {user.status === "active"
                ? "Deactivating this account marks it as deleted. The user cannot log in, but their data and orders are preserved."
                : "Reactivating restores login access for this account."}
            </p>
            <Button
              onClick={toggleStatus}
              loading={statusLoading}
              variant={user.status === "active" ? "danger" : "default"}
            >
              {user.status === "active" ? "Deactivate account" : "Reactivate account"}
            </Button>
          </Card>
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div style={{ marginTop: "20px" }}>
        <Card pad={false}>
          <div style={{ padding: "16px 20px 12px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Recent Orders {stats?.orderCount ? `(${stats.orderCount} total)` : ""}
          </div>
          {(data?.recentOrders ?? []).length === 0 ? (
            <EmptyState title="No orders" description="This user has not placed any orders yet." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                    <th>Date</th>
                    <th><span style={{ position: "absolute", left: -9999 }}>Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data!.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id.slice(-8).toUpperCase()}</td>
                      <td><Badge tone={STATUS_TONES[o.status] ?? "neutral"}>{cap(o.status)}</Badge></td>
                      <td className="num">{fmtINR(o.totalPaise)}</td>
                      <td>{fmtDate(o.createdAt)}</td>
                      <td><LinkButton href={`/portal-secure/orders/${o.id}`} size="sm">View</LinkButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Email / Audit log ── */}
      <div style={{ marginTop: "20px" }}>
        <Card pad={false}>
          <div style={{ padding: "16px 20px 12px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Email Log / Audit Trail
          </div>
          {(data?.emailLogs ?? []).length === 0 ? (
            <EmptyState title="No email logs" description="No emails have been sent to this address." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th>Error</th>
                    <th>Sent at</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.emailLogs.map((l) => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{l.kind}</td>
                      <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.subject}</td>
                      <td><Badge tone={STATUS_TONES[l.status] ?? "neutral"}>{cap(l.status)}</Badge></td>
                      <td>
                        {l.orderId
                          ? <LinkButton href={`/portal-secure/orders/${l.orderId}`} size="sm">#{l.orderId.slice(-8).toUpperCase()}</LinkButton>
                          : "—"}
                      </td>
                      <td style={{ maxWidth: "200px", fontSize: "11px", color: "var(--adm-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.error || "—"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
