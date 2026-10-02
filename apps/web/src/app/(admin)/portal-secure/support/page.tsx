"use client";
/** Admin · Support inbox: messages sent through the Contact us form (saved in MongoDB). Reply by email/WhatsApp, mark resolved. */
import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, EmptyState, LinkButton, PageHeader, TableSkeleton, useApi, useToast } from "@/components/admin/ui";
import { supportConfig } from "@/lib/support";

type Msg = { id: string; ref: string; name: string; email: string; phone: string; subject: string; message: string; orderRef: string; status: "new" | "open" | "resolved"; at: string };
const FILTERS = ["all", "new", "open", "resolved"] as const;
type Filter = (typeof FILTERS)[number];
const TONE = { new: "warn", open: "info", resolved: "success" } as const;

export default function SupportInboxPage() {
  const { data, error, loading, reload, setData } = useApi<{ messages: Msg[] }>("/api/admin/support");
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const messages = data?.messages ?? [];
  const counts = useMemo(() => ({ all: messages.length, new: messages.filter((m) => m.status === "new").length, open: messages.filter((m) => m.status === "open").length, resolved: messages.filter((m) => m.status === "resolved").length }), [messages]);
  const shown = messages.filter((m) => filter === "all" || m.status === filter);

  async function setStatus(m: Msg, status: Msg["status"]) {
    const prev = m.status;
    setData((d) => d && { messages: d.messages.map((x) => (x.id === m.id ? { ...x, status } : x)) });
    try {
      const r = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id, status }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      setData((d) => d && { messages: d.messages.map((x) => (x.id === m.id ? { ...x, status: prev } : x)) });
      toast(e instanceof Error ? e.message : "Could not update", "error");
    }
  }

  const cfg = supportConfig();
  return (
    <>
      <PageHeader eyebrow="Customers" title="Support inbox" description="Messages from the Contact us form. Customers also reach you on WhatsApp and email.">
        <Button onClick={reload}>Refresh</Button>
      </PageHeader>

      <div className="adm-actions" style={{ marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "primary" : "default"} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)} ({counts[f]})</Button>
        ))}
      </div>

      {error ? <Alert><span>{error} </span><Button size="sm" onClick={reload}>Retry</Button></Alert> : null}
      {loading && !data ? <Card><TableSkeleton rows={4} cols={4} /></Card> : shown.length === 0 ? (
        <Card><EmptyState title={filter === "all" ? "No messages yet" : `No ${filter} messages`} description="New messages from the Contact us form appear here and are emailed to your alert addresses." /></Card>
      ) : (
        <div className="adm-list">
          {shown.map((m) => {
            const open = openId === m.id;
            return (
              <Card key={m.id}>
                <div className="adm-actions" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{m.subject} <span className="adm-cell-sub">· {m.ref}{m.orderRef ? ` · ${m.orderRef}` : ""}</span></div>
                    <div className="adm-cell-sub">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""} · {new Date(m.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                  <Badge tone={TONE[m.status]}>{m.status}</Badge>
                </div>
                <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{open || m.message.length < 160 ? m.message : `${m.message.slice(0, 160)}…`}</p>
                <div className="adm-actions" style={{ marginTop: 12 }}>
                  {m.message.length >= 160 ? <Button size="sm" onClick={() => setOpenId(open ? null : m.id)}>{open ? "Show less" : "Read more"}</Button> : null}
                  <LinkButton href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: [${m.ref}] ${m.subject}`)}`} external>Reply by email</LinkButton>
                  {m.phone ? <LinkButton href={`https://wa.me/91${m.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi ${m.name.split(" ")[0]}, this is CULTRAVEN about your message ${m.ref}.`)}`} external>WhatsApp</LinkButton> : null}
                  {m.orderRef ? <span className="adm-cell-sub">Order {m.orderRef}</span> : null}
                  {m.status !== "open" && m.status !== "resolved" ? <Button size="sm" onClick={() => setStatus(m, "open")}>Mark in progress</Button> : null}
                  {m.status !== "resolved" ? <Button size="sm" variant="primary" onClick={() => setStatus(m, "resolved")}>Mark resolved</Button> : <Button size="sm" onClick={() => setStatus(m, "new")}>Reopen</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="adm-cell-sub" style={{ marginTop: 14 }}>Public support address: {cfg.email} · WhatsApp +{cfg.whatsapp} · {cfg.hours}</p>
    </>
  );
}
