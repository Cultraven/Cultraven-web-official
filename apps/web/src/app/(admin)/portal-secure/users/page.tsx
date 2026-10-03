"use client";
import React, { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, EmptyState, Icon, LinkButton, PageHeader, TableSkeleton, useApi } from "@/components/admin/ui";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
};

type Summary = { total: number; active: number; deleted: number; admins: number };

const ROLE_FILTERS = ["all", "customer", "admin"] as const;
const STATUS_FILTERS = ["all", "active", "deleted"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

const TONES: Record<string, "success" | "danger" | "neutral"> = {
  active: "success",
  deleted: "danger",
};

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
      <td>
        <Badge tone={u.role === "admin" ? "info" : "neutral"}>
          {u.role}
        </Badge>
      </td>
      <td>
        <Badge tone={TONES[u.status] ?? "neutral"}>{u.status}</Badge>
      </td>
      <td>
        <Badge tone={u.emailVerified ? "success" : "warn"}>
          {u.emailVerified ? "Verified" : "Unverified"}
        </Badge>
      </td>
      <td>{fmtDate(u.createdAt)}</td>
      <td><LinkButton href={href} size="sm">View</LinkButton></td>
    </tr>
  );
});

export default function UsersPage() {
  const { data, error, loading, reload } = useApi<{ users: UserRow[]; summary: Summary }>("/api/admin/users");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const dq = useDeferredValue(query);

  const users = data?.users ?? [];
  const summary = data?.summary;

  const rows = useMemo(() => {
    const q = dq.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q)
      );
    });
  }, [users, dq, role, status]);

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Users"
        description="All registered customers and admins."
      >
        <div style={{ display: "flex", gap: "8px" }}>
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

      {error ? (
        <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert>
      ) : null}

      <Card pad={false}>
        <div className="adm-toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input
              className="adm-input"
              type="search"
              aria-label="Search users"
              placeholder="Name, email, phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="adm-seg" role="group" aria-label="Filter by role">
            {ROLE_FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={role === f} onClick={() => setRole(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
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
              <tbody>
                {rows.map((u) => <Row key={u.id} u={u} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
