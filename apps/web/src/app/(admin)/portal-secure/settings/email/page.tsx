"use client";
/**
 * Admin · Email (SMTP). Credentials are stored encrypted in MongoDB; the password is never sent back to the browser.
 * Order confirmations go to the customer and an alert goes to the admin addresses below.
 */
import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, PageHeader, Switch, useToast } from "@/components/admin/ui";

interface Form { enabled: boolean; host: string; port: string; secure: boolean; user: string; pass: string; fromName: string; fromEmail: string; adminEmails: string }
const EMPTY: Form = { enabled: true, host: "", port: "587", secure: false, user: "", pass: "", fromName: "CULTRAVEN", fromEmail: "", adminEmails: "" };

const PRESETS: { label: string; host: string; port: string; secure: boolean }[] = [
  { label: "Gmail", host: "smtp.gmail.com", port: "465", secure: true },
  { label: "Zoho", host: "smtp.zoho.in", port: "465", secure: true },
  { label: "Brevo", host: "smtp-relay.brevo.com", port: "587", secure: false },
  { label: "Outlook", host: "smtp.office365.com", port: "587", secure: false },
];

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [f, setF] = useState<Form>(EMPTY);
  const [hasPassword, setHasPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [logs, setLogs] = useState<{ id: string; kind: string; to: string; subject: string; status: string; error: string; at: string }[] | null>(null);
  const loadLogs = () => fetch("/api/admin/email-logs", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setLogs(d?.logs ?? [])).catch(() => setLogs([]));
  useEffect(() => { loadLogs(); }, []);

  useEffect(() => {
    fetch("/api/admin/settings/smtp", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d; })
      .then((d) => {
        const s = d.settings;
        if (s) {
          setF({ enabled: s.enabled, host: s.host, port: String(s.port), secure: s.secure, user: s.user, pass: "", fromName: s.fromName, fromEmail: s.fromEmail, adminEmails: (s.adminEmails ?? []).join(", ") });
          setHasPassword(!!s.hasPassword);
          setTestTo((s.adminEmails ?? [])[0] ?? "");
        }
        setLoaded(true);
      })
      .catch((e) => { setLoadError(e.message); setLoaded(true); });
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const setPort = (v: string) => { const p = v.replace(/\D/g, "").slice(0, 5); setF((x) => ({ ...x, port: p, secure: p === "465" ? true : p === "587" ? false : x.secure })); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setResult(null);
    try {
      const r = await fetch("/api/admin/settings/smtp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, port: Number(f.port) || 0, pass: f.pass || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setHasPassword(true); set("pass", "");
      toast("Email settings saved");
    } catch (err: any) { toast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const r = await fetch("/api/admin/settings/smtp/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testTo }) });
      const d = await r.json().catch(() => ({}));
      setResult({ ok: r.ok && d.ok, text: d.message || d.error || `HTTP ${r.status}` });
    } catch { setResult({ ok: false, text: "Network error" }); }
    finally { setTesting(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Settings" title="Email (SMTP)" description="Customers get an order confirmation; you get an alert for every new order." />
      {loadError ? <Alert>Couldn&apos;t load settings ({loadError}).</Alert> : null}

      <form onSubmit={save} noValidate>
        <Card title="Mail server">
          <div className="adm-actions" style={{ marginBottom: 14 }}>
            <span className="adm-cell-sub" style={{ alignSelf: "center" }}>Quick fill:</span>
            {PRESETS.map((p) => (
              <Button key={p.label} size="sm" onClick={() => setF((x) => ({ ...x, host: p.host, port: p.port, secure: p.secure }))}>{p.label}</Button>
            ))}
          </div>
          <div className="adm-grid adm-grid-2">
            <Field label="SMTP host" required><input className="adm-input" value={f.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.gmail.com" autoComplete="off" /></Field>
            <Field label="Port" hint="465 = SSL, 587 = STARTTLS" required><input className="adm-input" inputMode="numeric" value={f.port} onChange={(e) => setPort(e.target.value)} /></Field>
            <Field label="Username" required><input className="adm-input" value={f.user} onChange={(e) => set("user", e.target.value)} placeholder="orders@yourdomain.com" autoComplete="off" /></Field>
            <Field label="Password" hint={hasPassword ? "A password is saved. Leave blank to keep it." : "Gmail: use a 16-character App Password."} required={!hasPassword}>
              <input className="adm-input" type="password" value={f.pass} onChange={(e) => set("pass", e.target.value)} placeholder={hasPassword ? "••••••••  (saved)" : ""} autoComplete="new-password" />
            </Field>
          </div>
          <div className="adm-row" style={{ marginTop: 14 }}>
            <div className="adm-row-main"><b>Use SSL (implicit TLS)</b><div className="adm-cell-sub">ON for port 465. OFF for 587 (the connection upgrades with STARTTLS).</div></div>
            <Switch checked={f.secure} onChange={(v) => set("secure", v)} label="Use SSL" />
          </div>
        </Card>

        <div style={{ height: 16 }} />
        <Card title="Who it's from, and who gets alerts">
          <div className="adm-grid adm-grid-2">
            <Field label="From name" required><input className="adm-input" value={f.fromName} onChange={(e) => set("fromName", e.target.value)} /></Field>
            <Field label="From email" hint="Use an address on your own domain (matches your SMTP account)." required><input className="adm-input" type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder="orders@yourdomain.com" /></Field>
            <Field label="Send new-order alerts to" hint="One or more addresses, separated by commas." span><input className="adm-input" value={f.adminEmails} onChange={(e) => set("adminEmails", e.target.value)} placeholder="you@yourdomain.com, ops@yourdomain.com" /></Field>
          </div>
          <div className="adm-row" style={{ marginTop: 14 }}>
            <div className="adm-row-main"><b>Send order emails</b><div className="adm-cell-sub">Turn off to pause all order emails without losing your settings.</div></div>
            <Switch checked={f.enabled} onChange={(v) => set("enabled", v)} label="Send order emails" />
          </div>
        </Card>

        <div className="adm-actions" style={{ marginTop: 16 }}>
          <Button type="submit" variant="primary" loading={saving} disabled={!loaded}>Save settings</Button>
        </div>
      </form>

      <div style={{ height: 16 }} />
      <Card title="Send a test email">
        <p className="adm-cell-sub" style={{ marginBottom: 10 }}>Save first, then check the settings work. The password is never shown on this page.</p>
        <div className="adm-actions">
          <input className="adm-input" style={{ maxWidth: 320 }} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="send the test to…" aria-label="Test recipient" />
          <Button onClick={test} loading={testing} disabled={!testTo}>Send test</Button>
        </div>
        {result ? <div style={{ marginTop: 12 }}><Alert kind={result.ok ? "success" : "error"}>{result.text}</Alert></div> : null}
      </Card>

      <div style={{ height: 16 }} />
      <Card title="Recent emails" actions={<Button size="sm" onClick={loadLogs}>Refresh</Button>}>
        <p className="adm-cell-sub" style={{ marginBottom: 10 }}>Every order email the site tried to send. &quot;Skipped&quot; means email isn&apos;t set up (or is switched off); &quot;Failed&quot; shows why.</p>
        {logs === null ? <p className="adm-cell-sub">Loading…</p> : logs.length === 0 ? <p className="adm-cell-sub">Nothing sent yet.</p> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th scope="col">When</th><th scope="col">To</th><th scope="col">Email</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(l.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                    <td>{l.to}</td>
                    <td>{l.subject}</td>
                    <td><Badge tone={l.status === "sent" ? "success" : l.status === "failed" ? "danger" : "warn"}>{l.status}</Badge>{l.error ? <div className="adm-cell-sub">{l.error}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
