"use client";
/**
 * Admin · Subscribers: people who asked (in a "Notify me" box or the footer) to be told about new drops.
 * See who is interested, add someone by hand, unsubscribe / resubscribe, keep a private note, remove, and download the list as CSV.
 * Every new sign-up is also emailed to your alert addresses.
 */
import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, Field, Icon, PageHeader, TableSkeleton, useApi, useConfirm, useToast } from "@/components/admin/ui";

type Row = { id: string; email: string; status: "subscribed" | "unsubscribed"; interest: string; page: string; source: string; note: string; at: string };
type Data = { subscribers: Row[]; counts: { all: number; subscribed: number; unsubscribed: number }; limit: number };
const FILTERS = ["all", "subscribed", "unsubscribed"] as const;
type Filter = (typeof FILTERS)[number];

const when = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); };

async function call(method: string, body: unknown): Promise<any> {
  const r = await fetch("/api/admin/subscribers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Something went wrong (${r.status})`);
  return j;
}

export default function SubscribersPage() {
  const { data, error, loading, reload, setData } = useApi<Data>("/api/admin/subscribers");
  const { toast } = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const rows = data?.subscribers ?? [];
  const counts = data?.counts ?? { all: 0, subscribed: 0, unsubscribed: 0 };
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => (filter === "all" || r.status === filter) && (!q || r.email.includes(q) || r.interest.toLowerCase().includes(q) || r.note.toLowerCase().includes(q)));
  }, [rows, filter, query]);

  const patchLocal = (id: string, next: Partial<Row>) => setData((d) => d && { ...d, subscribers: d.subscribers.map((r) => (r.id === id ? { ...r, ...next } : r)) });
  const bump = (from: Row["status"] | null, to: Row["status"] | null) => setData((d) => {
    if (!d) return d;
    const c = { ...d.counts };
    if (from) { c[from] -= 1; c.all -= 1; }
    if (to) { c[to] += 1; c.all += 1; }
    return { ...d, counts: c };
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setAdding(true);
    try {
      const j = await call("POST", { email: email.trim(), interest: interest.trim() || undefined });
      setData((d) => d && { ...d, subscribers: [j.subscriber, ...d.subscribers] });
      bump(null, "subscribed");
      setEmail("");
      setInterest("");
      toast(`${j.subscriber.email} added`, "success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add that email");
    } finally { setAdding(false); }
  }

  async function setStatus(r: Row, status: Row["status"]) {
    const prev = r.status;
    patchLocal(r.id, { status });
    bump(prev, status);
    try {
      await call("PATCH", { id: r.id, status });
      toast(status === "unsubscribed" ? `${r.email} unsubscribed` : `${r.email} subscribed again`, "success");
    } catch (err) {
      patchLocal(r.id, { status: prev });
      bump(status, prev);
      toast(err instanceof Error ? err.message : "Could not update", "error");
    }
  }

  async function saveNote(r: Row) {
    const prev = r.note;
    patchLocal(r.id, { note: noteDraft });
    setNoteId(null);
    try { await call("PATCH", { id: r.id, note: noteDraft }); toast("Note saved", "success"); }
    catch (err) { patchLocal(r.id, { note: prev }); toast(err instanceof Error ? err.message : "Could not save the note", "error"); }
  }

  async function remove(r: Row) {
    const ok = await confirm({ title: "Remove this person?", message: `${r.email} will be removed from the list. They can sign up again any time.`, confirmLabel: "Remove" });
    if (!ok) return;
    try {
      await call("DELETE", { ids: [r.id] });
      setData((d) => d && { ...d, subscribers: d.subscribers.filter((x) => x.id !== r.id) });
      bump(r.status, null);
      toast(`${r.email} removed`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not remove", "error");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Customers" title="Subscribers" description="People who asked to be told when new pieces drop (from the “Notify me” boxes and the footer). Each new sign-up is also emailed to your alert addresses.">
        <Button onClick={reload}>Refresh</Button>
        <a className="adm-btn" href="/api/admin/subscribers/export" download><Icon name="download" size={16} />Download CSV</a>
      </PageHeader>

      <Card title="Add someone by hand" pad>
        <form onSubmit={add} className="adm-actions" style={{ alignItems: "flex-end", gap: 12, flexWrap: "wrap" }} aria-label="Add a subscriber">
          <Field label="Email address" required>
            <input className="adm-input" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={{ minWidth: 240 }} aria-invalid={formError ? true : undefined} />
          </Field>
          <Field label="Interested in (optional)">
            <input className="adm-input" maxLength={60} value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="e.g. New Drop" />
          </Field>
          <Button type="submit" variant="primary" loading={adding}>Add</Button>
        </form>
        {formError ? <div style={{ marginTop: 12 }}><Alert>{formError}</Alert></div> : null}
      </Card>

      <div style={{ height: 14 }} />
      {error ? <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert> : null}

      <Card pad={false}>
        <div className="adm-toolbar">
          <div className="adm-search">
            <Icon name="search" size={16} />
            <input className="adm-input" type="search" aria-label="Search subscribers" placeholder="Search email, interest or note…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="adm-seg" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)} ({counts[f]})</button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={5} cols={5} />
        ) : shown.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? "No sign-ups yet" : "No matching people"}
            description={rows.length === 0 ? "When a visitor leaves their email in a “Notify me” box, they show up here and you get an email." : "Try a different search or filter."}
          />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Interested in</th>
                  <th scope="col">Signed up</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="adm-cell-title" style={{ overflowWrap: "anywhere" }}>{r.email}</div>
                      {noteId === r.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); void saveNote(r); }} className="adm-actions" style={{ marginTop: 6, gap: 6 }}>
                          <input className="adm-input" aria-label={`Note for ${r.email}`} maxLength={300} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} autoFocus placeholder="Private note" />
                          <Button size="sm" variant="primary" type="submit">Save</Button>
                          <Button size="sm" onClick={() => setNoteId(null)}>Cancel</Button>
                        </form>
                      ) : r.note ? <div className="adm-cell-sub">Note: {r.note}</div> : null}
                    </td>
                    <td>
                      <div>{r.interest || "General"}</div>
                      {r.page ? <div className="adm-cell-sub">{r.page}</div> : r.source === "admin" ? <div className="adm-cell-sub">Added by hand</div> : null}
                    </td>
                    <td>{when(r.at)}</td>
                    <td><Badge tone={r.status === "subscribed" ? "success" : "neutral"}>{r.status}</Badge></td>
                    <td>
                      <div className="adm-actions">
                        {r.status === "subscribed" ? <Button size="sm" onClick={() => setStatus(r, "unsubscribed")}>Unsubscribe</Button> : <Button size="sm" variant="primary" onClick={() => setStatus(r, "subscribed")}>Subscribe again</Button>}
                        <Button size="sm" onClick={() => { setNoteId(r.id); setNoteDraft(r.note); }}>Note</Button>
                        <Button size="sm" variant="danger" onClick={() => remove(r)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {data && counts.all > rows.length ? <p className="adm-cell-sub" style={{ marginTop: 14 }}>Showing the newest {rows.length} of {counts.all}. Download the CSV to get everyone.</p> : null}
      <p className="adm-cell-sub" style={{ marginTop: 14 }}>Unsubscribed people stay on file so they are not added again by mistake, but should be left out when you announce a drop.</p>
    </>
  );
}
