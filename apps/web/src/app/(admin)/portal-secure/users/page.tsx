"use client";
import React, { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, EmptyState, Field, Icon, LinkButton, PageHeader, TableSkeleton, useApi, useToast } from "@/components/admin/ui";

type UserRow = {
  id: string; fullName: string; email: string; phone: string | null;
  role: string; status: string; emailVerified: boolean; createdAt: string;
};
type Summary = { total: number; active: number; deleted: number; admins: number };
type Me = { role: "admin" | "superadmin" };

const ROLE_FILTERS = ["all", "customer", "admin", "delivery"] as const;
const STATUS_FILTERS = ["all", "active", "deleted"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

const ROLE_TONES: Record<string, "neutral" | "info" | "warn" | "danger"> = {
  customer: "neutral", delivery: "info", admin: "warn", superadmin: "danger",
};
const STATUS_TONES: Record<string, "success" | "danger" | "neutral"> = { active: "success", deleted: "danger" };

function fmtDate(s: string) {
  return s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

const Row = React.memo(function Row({ u }: { u: UserRow }) {
  const href = `/portal-secure/users/${u.id}`;
  return (
    <tr>
      <td>
        <div className="adm-cell-title">
          <Link href={href} prefetch={false} style={{ fontWeight: 600 }}>{u.fullName}</Link>
        </div>
        <div className="adm-cell-sub">{u.email}</div>
      </td>
      <td>{u.phone ?? "—"}</td>
      <td><Badge tone={ROLE_TONES[u.role] ?? "neutral"}>{u.role}</Badge></td>
      <td><Badge tone={STATUS_TONES[u.status] ?? "neutral"}>{u.status}</Badge></td>
      <td><Badge tone={u.emailVerified ? "success" : "warn"}>{u.emailVerified ? "Verified" : "Unverified"}</Badge></td>
      <td>{fmtDate(u.createdAt)}</td>
      <td><LinkButton href={href} size="sm">View</LinkButton></td>
    </tr>
  );
});

// ── Create Staff Modal ────────────────────────────────────────────────────────
function CreateStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      toast(`${form.role === "admin" ? "Admin" : form.role === "delivery" ? "Delivery staff" : "User"} created`, "success");
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create user");
    } finally { setLoading(false); }
  };

  return (
    <div className="adm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--a-surface)", border: "1px solid var(--a-border)", borderRadius: 14, width: "min(480px, 100%)", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 24px 18px", borderBottom: "1px solid var(--a-border)" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 3px", color: "var(--a-text)", letterSpacing: "-0.01em" }}>Create Staff Account</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--a-muted)", lineHeight: 1.4 }}>Add an admin, delivery staff, or customer account.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ flexShrink: 0, marginTop: 2, width: 28, height: 28, display: "grid", placeItems: "center", background: "var(--a-surface-2)", border: "1px solid var(--a-border)", borderRadius: 6, cursor: "pointer", fontSize: 16, color: "var(--a-muted)", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px", overflowY: "auto", flex: 1 }}>
          {error ? (
            <div role="alert" className="adm-alert adm-alert-error" style={{ marginBottom: 18 }}><div>{error}</div></div>
          ) : null}

          <form id="create-staff-form" onSubmit={submit} style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="First name" required>
                <input className="adm-input" value={form.firstName} onChange={set("firstName")} required placeholder="Rahul" autoFocus />
              </Field>
              <Field label="Last name" required>
                <input className="adm-input" value={form.lastName} onChange={set("lastName")} required placeholder="Sharma" />
              </Field>
            </div>

            <Field label="Email address" required>
              <input className="adm-input" type="email" value={form.email} onChange={set("email")} required placeholder="rahul@example.com" />
            </Field>

            <Field label="Temporary password" required hint="Min. 8 characters — share this securely with the person">
              <input className="adm-input" value={form.password} onChange={set("password")} required placeholder="At least 8 characters" minLength={8} />
            </Field>

            <Field label="Role" required>
              <select className="adm-input" value={form.role} onChange={set("role")}>
                <option value="admin">Admin — full panel access</option>
                <option value="delivery">Delivery staff — delivery portal only</option>
              </select>
            </Field>
          </form>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 24px", borderTop: "1px solid var(--a-border)", background: "var(--a-surface-2)" }}>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="create-staff-form" loading={loading}>Create account</Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { data, error, loading, reload } = useApi<{ users: UserRow[]; summary: Summary }>("/api/admin/users");
  const { data: meData } = useApi<Me>("/api/admin/me");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const dq = useDeferredValue(query);

  const users = data?.users ?? [];
  const summary = data?.summary;
  const isSuperAdmin = meData?.role === "superadmin";

  const rows = useMemo(() => {
    const q = dq.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      if (!q) return true;
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? "").includes(q);
    });
  }, [users, dq, role, status]);

  return (
    <>
      {showCreate ? <CreateStaffModal onClose={() => setShowCreate(false)} onCreated={reload} /> : null}

      <PageHeader eyebrow="Store" title="Users & Roles" description="All registered customers and staff accounts.">
        <div style={{ display: "flex", gap: "8px" }}>
          {isSuperAdmin ? (
            <Button variant="primary" icon="plus" onClick={() => setShowCreate(true)}>
              Add staff
            </Button>
          ) : null}
          <a href="/api/admin/users/export?format=csv" className="adm-btn adm-btn-sm" download>
            <Icon name="download" size={15} /> CSV
          </a>
          <a href="/api/admin/users/export?format=pdf" className="adm-btn adm-btn-sm" target="_blank" rel="noopener noreferrer">
            <Icon name="ext" size={15} /> PDF
          </a>
        </div>
      </PageHeader>

      {summary ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total users", value: summary.total },
            { label: "Active", value: summary.active },
            { label: "Deleted", value: summary.deleted },
            { label: "Admins", value: summary.admins },
          ].map((s) => (
            <Card key={s.label} pad>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--adm-muted)", marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--adm-text)" }}>{s.value}</div>
            </Card>
          ))}
        </div>
      ) : null}

      {error ? <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert> : null}

      <Card pad={false}>
        <div className="adm-toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input className="adm-input" type="search" aria-label="Search users" placeholder="Name, email, phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="adm-seg" role="group" aria-label="Filter by role">
            {ROLE_FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={role === f} onClick={() => setRole(f)}>
                {f === "all" ? "All" : f === "delivery" ? "Delivery" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="adm-seg" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={status === f} onClick={() => setStatus(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={users.length === 0 ? "No users yet" : "No matching users"}
            description={users.length === 0 ? "Users will appear here after customers sign up." : "Try a different search or filter."}
          />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">Name / Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Email</th>
                  <th scope="col">Joined</th>
                  <th scope="col"><span style={{ position: "absolute", left: -9999 }}>Actions</span></th>
                </tr>
              </thead>
              <tbody>{rows.map((u) => <Row key={u.id} u={u} />)}</tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
