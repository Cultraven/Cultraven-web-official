"use client";
/**
 * Admin · Email. The site can send from two mailboxes — Orders and Support — each with its own SMTP login (stored encrypted in
 * MongoDB; passwords are never sent back to the browser). A table shows every kind of email, what triggers it, who receives it,
 * which mailbox is set to send it and which one is actually in use right now.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, PageHeader, Switch, useToast } from "@/components/admin/ui";
import { MAIL_PROFILES, PROFILE_LABEL, PROFILE_PLACEHOLDER, type MailProfile } from "@/lib/mail-routing";

interface Form { enabled: boolean; host: string; port: string; secure: boolean; user: string; pass: string; fromName: string; fromEmail: string }
const EMPTY: Record<MailProfile, Form> = {
  orders: { enabled: true, host: "", port: "587", secure: false, user: "", pass: "", fromName: "CULTRAVEN", fromEmail: "" },
  support: { enabled: true, host: "", port: "587", secure: false, user: "", pass: "", fromName: "CULTRAVEN Support", fromEmail: "" },
};

const PRESETS: { label: string; host: string; port: string; secure: boolean }[] = [
  { label: "Gmail", host: "smtp.gmail.com", port: "465", secure: true },
  { label: "Zoho", host: "smtp.zoho.in", port: "465", secure: true },
  { label: "Brevo", host: "smtp-relay.brevo.com", port: "587", secure: false },
  { label: "Outlook", host: "smtp.office365.com", port: "587", secure: false },
];

interface ProfileInfo { id: MailProfile; label: string; configured: boolean; enabled: boolean; fromEmail: string; host: string }
interface CategoryInfo {
  id: string; label: string; audience: string; when: string; examples: string; defaultProfile: MailProfile;
  chosen: MailProfile; using: MailProfile | null; usingFrom: string | null; fellBack: boolean;
  stats: { sent: number; failed: number; skipped: number; lastAt: string | null; lastFrom: string };
}
interface RoutingData { days: number; profiles: ProfileInfo[]; categories: CategoryInfo[]; adminEmails: string[] }
interface DnsItem { status: "ok" | "missing" | "fix"; title: string; message: string; found?: string; add?: { type: string; name: string; value: string }; steps?: string[] }
interface DnsReport { domain: string; allGood: boolean; spf: DnsItem; dkim: DnsItem; dmarc: DnsItem; mx: { status: "ok" | "missing"; records: string[] } }
interface LogRow { id: string; kind: string; to: string; subject: string; status: string; from: string; category: string; error: string; at: string }

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

// ── One mailbox: its SMTP login, sender name and a test send ─────────────────────────

function MailboxEditor({ profile, info, onSaved }: { profile: MailProfile; info?: ProfileInfo; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState<Form>(EMPTY[profile]);
  const [hasPassword, setHasPassword] = useState(false);
  const [exists, setExists] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/settings/smtp?profile=${profile}`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d; })
      .then((d) => {
        const s = d.settings;
        if (s) {
          setF({ enabled: s.enabled, host: s.host, port: String(s.port), secure: s.secure, user: s.user, pass: "", fromName: s.fromName, fromEmail: s.fromEmail });
          setHasPassword(!!s.hasPassword); setExists(true);
          setTestTo((s.adminEmails ?? [])[0] ?? "");
        }
        setLoaded(true);
      })
      .catch((e) => { setLoadError(e.message); setLoaded(true); });
  }, [profile]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const setPort = (v: string) => { const p = v.replace(/\D/g, "").slice(0, 5); setF((x) => ({ ...x, port: p, secure: p === "465" ? true : p === "587" ? false : x.secure })); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setResult(null);
    try {
      const r = await fetch(`/api/admin/settings/smtp?profile=${profile}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, port: Number(f.port) || 0, pass: f.pass || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setHasPassword(true); setExists(true); set("pass", "");
      if (d.check?.ok === false) { setResult({ ok: false, text: `Saved — but the mail server refused the login. ${d.check.message}` }); toast("Saved, but the login was refused — see the message below", "error"); }
      else if (d.check?.ok === true) { setResult({ ok: true, text: `Saved, and the login to ${f.host} works.` }); toast(`${PROFILE_LABEL[profile]} saved — login works`); }
      else { if (d.check?.message) setResult({ ok: false, text: d.check.message }); toast(`${PROFILE_LABEL[profile]} saved`); }
      onSaved();
    } catch (err: any) { toast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const r = await fetch("/api/admin/settings/smtp/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testTo, profile }) });
      const d = await r.json().catch(() => ({}));
      setResult({ ok: r.ok && d.ok, text: d.message || d.error || `HTTP ${r.status}` });
    } catch { setResult({ ok: false, text: "Network error" }); }
    finally { setTesting(false); }
  };

  return (
    <form onSubmit={save} noValidate>
      {loadError ? <Alert>Couldn&apos;t load settings ({loadError}).</Alert> : null}
      {loaded && !exists ? (
        <Alert kind="info">
          {profile === "orders"
            ? "The Orders mailbox isn't saved yet. Fill it in and save — emails can't be sent until it is."
            : "The Support mailbox isn't set up yet, so its emails are sent from the Orders mailbox for now. Fill this in and save to start sending them from your support address."}
        </Alert>
      ) : null}

      <div className="adm-actions" style={{ margin: "14px 0" }}>
        <span className="adm-cell-sub" style={{ alignSelf: "center" }}>Quick fill:</span>
        {PRESETS.map((p) => (
          <Button key={p.label} size="sm" onClick={() => setF((x) => ({ ...x, host: p.host, port: p.port, secure: p.secure }))}>{p.label}</Button>
        ))}
      </div>
      <div className="adm-grid adm-grid-2">
        <Field label="SMTP host" required><input className="adm-input" value={f.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.gmail.com" autoComplete="off" /></Field>
        <Field label="Port" hint="465 = SSL, 587 = STARTTLS" required><input className="adm-input" inputMode="numeric" value={f.port} onChange={(e) => setPort(e.target.value)} /></Field>
        <Field label="Username" required><input className="adm-input" value={f.user} onChange={(e) => set("user", e.target.value)} placeholder={PROFILE_PLACEHOLDER[profile]} autoComplete="off" /></Field>
        <Field label="Password" hint={hasPassword ? "A password is saved. Leave blank to keep it." : "Gmail: use a 16-character App Password."} required={!hasPassword}>
          <input className="adm-input" type="password" value={f.pass} onChange={(e) => set("pass", e.target.value)} placeholder={hasPassword ? "••••••••  (saved)" : ""} autoComplete="new-password" />
        </Field>
        <Field label="From name" hint="What the customer sees as the sender." required><input className="adm-input" value={f.fromName} onChange={(e) => set("fromName", e.target.value)} /></Field>
        <Field label="From email" hint="An address on your own domain (matches the username)." required><input className="adm-input" type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder={PROFILE_PLACEHOLDER[profile]} /></Field>
      </div>
      <div className="adm-row" style={{ marginTop: 14 }}>
        <div className="adm-row-main"><b>Use SSL (implicit TLS)</b><div className="adm-cell-sub">ON for port 465. OFF for 587 (the connection upgrades with STARTTLS).</div></div>
        <Switch checked={f.secure} onChange={(v) => set("secure", v)} label="Use SSL" />
      </div>
      <div className="adm-row" style={{ marginTop: 10 }}>
        <div className="adm-row-main"><b>Use this mailbox</b><div className="adm-cell-sub">Turn off to pause it without losing its settings. Emails set to use it are sent from the Orders mailbox instead{profile === "orders" ? " — and if that is off too, they are skipped" : ""}.</div></div>
        <Switch checked={f.enabled} onChange={(v) => set("enabled", v)} label="Use this mailbox" />
      </div>

      <div className="adm-actions" style={{ marginTop: 16 }}>
        <Button type="submit" variant="primary" loading={saving} disabled={!loaded}>Save {PROFILE_LABEL[profile]}</Button>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--a-border, #e5e7eb)" }}>
        <b>Send a test email from this mailbox</b>
        <p className="adm-cell-sub" style={{ margin: "4px 0 10px" }}>Save first, then check it works. {info?.fromEmail ? <>It will be sent from <b>{info.fromEmail}</b>.</> : null}</p>
        <div className="adm-actions">
          <input className="adm-input" style={{ maxWidth: 320 }} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="send the test to…" aria-label="Test recipient" />
          <Button onClick={test} loading={testing} disabled={!testTo || !exists}>Send test</Button>
        </div>
        {result ? <div style={{ marginTop: 12 }}><Alert kind={result.ok ? "success" : "error"}>{result.text}</Alert></div> : null}
      </div>
    </form>
  );
}

// ── Which mailbox sends what ─────────────────────────────────────────────────────────

function RoutingCard({ data, reload }: { data: RoutingData; reload: () => void }) {
  const { toast } = useToast();
  const initial = Object.fromEntries(data.categories.map((c) => [c.id, c.chosen])) as Record<string, MailProfile>;
  const [choice, setChoice] = useState<Record<string, MailProfile>>(initial);
  const [alerts, setAlerts] = useState(data.adminEmails.join(", "));
  const [saving, setSaving] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  useEffect(() => { setChoice(Object.fromEntries(data.categories.map((c) => [c.id, c.chosen])) as Record<string, MailProfile>); setAlerts(data.adminEmails.join(", ")); }, [data]);
  const dirty = data.categories.some((c) => choice[c.id] !== c.chosen);
  const configured = (p: MailProfile) => data.profiles.find((x) => x.id === p)?.configured;

  const saveRouting = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/mail-routing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ routing: choice }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      toast("Saved — new emails will use these mailboxes"); reload();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };
  const saveAlerts = async () => {
    setSavingAlerts(true);
    try {
      const r = await fetch("/api/admin/settings/mail-routing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminEmails: alerts }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      toast("Alert addresses saved"); reload();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSavingAlerts(false); }
  };

  return (
    <Card title="Which mailbox sends what" actions={<Button variant="primary" size="sm" onClick={saveRouting} loading={saving} disabled={!dirty}>Save changes</Button>}>
      <p className="adm-cell-sub" style={{ marginBottom: 12 }}>
        Every email the site sends is listed here, with what triggers it and who receives it. Pick the mailbox that should send each kind. &quot;Right now&quot; shows the address actually in use — if a chosen mailbox isn&apos;t set up, the Orders mailbox covers for it so nothing is lost.
      </p>
      <div className="adm-route-wrap">
        <div className="adm-route adm-route-head" aria-hidden="true"><span>Email</span><span>When it is sent</span><span>Goes to</span><span>Sent from</span><span>Last {data.days} days</span></div>
        {data.categories.map((c) => (
          <div key={c.id} className="adm-route">
            <div><b>{c.label}</b><div className="adm-cell-sub">{c.examples}</div></div>
            <div><span className="adm-route-label">When it is sent</span><span className="adm-cell-sub">{c.when}</span></div>
            <div><span className="adm-route-label">Goes to</span>{c.audience}</div>
            <div>
              <span className="adm-route-label">Sent from</span>
              <select className="adm-select" value={choice[c.id]} onChange={(e) => setChoice((x) => ({ ...x, [c.id]: e.target.value as MailProfile }))} aria-label={`Mailbox for ${c.label}`}>
                {MAIL_PROFILES.map((p) => <option key={p} value={p}>{PROFILE_LABEL[p]}{configured(p) ? "" : " (not set up)"}</option>)}
              </select>
              <div className="adm-cell-sub" style={{ marginTop: 4, wordBreak: "break-word" }}>
                {c.using ? <>Right now: <b>{c.usingFrom}</b></> : <span style={{ color: "var(--a-danger, #b42318)" }}>Not sending — no mailbox is set up</span>}
                {c.fellBack ? <> (the {PROFILE_LABEL[c.chosen]} isn&apos;t set up yet)</> : null}
              </div>
            </div>
            <div>
              <span className="adm-route-label">Last {data.days} days</span>
              {c.stats.sent + c.stats.failed + c.stats.skipped === 0 ? <span className="adm-cell-sub">None yet</span> : (
                <>
                  <b>{c.stats.sent}</b> sent
                  {c.stats.failed ? <> · <span style={{ color: "var(--a-danger, #b42318)" }}>{c.stats.failed} failed</span></> : null}
                  {c.stats.skipped ? <> · {c.stats.skipped} skipped</> : null}
                  {c.stats.lastAt ? <div className="adm-cell-sub" style={{ wordBreak: "break-word" }}>Last: {when(c.stats.lastAt)}{c.stats.lastFrom ? <> from {c.stats.lastFrom}</> : null}</div> : null}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {!configured("support") ? <div style={{ marginTop: 12 }}><Alert kind="info">Only the Orders mailbox is set up, so every email is sent from it. Add the Support mailbox above to send contact-form, account and staff emails from your support address.</Alert></div> : null}

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--a-border, #e5e7eb)" }}>
        <b>Who receives the team alerts</b>
        <p className="adm-cell-sub" style={{ margin: "4px 0 10px" }}>New orders, cancellations, returns, contact-form messages and delivery KYC alerts go to these addresses (separate them with commas).</p>
        <div className="adm-actions">
          <input className="adm-input" style={{ maxWidth: 520, flex: "1 1 260px" }} value={alerts} onChange={(e) => setAlerts(e.target.value)} placeholder="you@yourdomain.com, ops@yourdomain.com" aria-label="Team alert addresses" />
          <Button onClick={saveAlerts} loading={savingAlerts} disabled={alerts.trim() === data.adminEmails.join(", ")}>Save addresses</Button>
        </div>
      </div>
    </Card>
  );
}

// ── Will the emails reach the inbox? ─────────────────────────────────────────────────

function DnsCard({ toastCopy }: { toastCopy: (text: string) => void }) {
  const [reports, setReports] = useState<DnsReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const check = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/admin/settings/smtp/dns", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setReports(d.reports);
    } catch (e: any) { setReports(null); setError(e.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { check(); }, [check]);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toastCopy("Copied"); } catch { toastCopy("Select the text and copy it"); } };

  return (
    <Card title="Will your emails reach the inbox?" actions={<Button size="sm" onClick={check} loading={busy}>Check again</Button>}>
      <p className="adm-cell-sub" style={{ marginBottom: 10 }}>
        &quot;Sent&quot; in the log below only means the mail server accepted the message. For Gmail, Outlook and Yahoo to put it in the <b>inbox</b> (not Spam), your domain needs three small DNS records. This checks them live.
      </p>
      {error ? <Alert>{error}</Alert> : null}
      {!reports && !error ? <p className="adm-cell-sub">{busy ? "Checking…" : "Save a mailbox, then press Check again."}</p> : null}
      {reports?.map((dns) => (
        <div key={dns.domain} style={{ marginTop: 12 }}>
          <Alert kind={dns.allGood ? "success" : "error"}>
            {dns.allGood
              ? <>All three records are set up for <b>{dns.domain}</b>. Your emails can be verified by Gmail and other inboxes.</>
              : <>Emails from <b>{dns.domain}</b> are accepted by the mail server, but can&apos;t be verified, so they may go to Spam or never show up. Add the records marked below at your domain&apos;s DNS (where you bought the domain), then press Check again — changes can take a few minutes up to a few hours.</>}
          </Alert>
          {([dns.spf, dns.dkim, dns.dmarc] as DnsItem[]).map((c) => (
            <div key={c.title} className="adm-row" style={{ display: "block", marginTop: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Badge tone={c.status === "ok" ? "success" : c.status === "fix" ? "warn" : "danger"}>{c.status === "ok" ? "Set up" : c.status === "fix" ? "Needs fixing" : "Missing"}</Badge>
                <b>{c.title}</b>
              </div>
              <div className="adm-cell-sub" style={{ marginTop: 6 }}>{c.message}</div>
              {c.found ? <div className="adm-cell-sub" style={{ marginTop: 6, wordBreak: "break-all" }}>Found: <code>{c.found}</code></div> : null}
              {c.add ? (
                <div style={{ marginTop: 8, padding: 10, border: "1px solid var(--a-border, #ddd)", borderRadius: 8 }}>
                  <div className="adm-cell-sub" style={{ marginBottom: 6 }}>Add this record:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13 }}>
                    <span className="adm-cell-sub">Type</span><b>{c.add.type}</b>
                    <span className="adm-cell-sub">Name</span><span><code>{c.add.name}</code>{c.add.name === "@" ? <span className="adm-cell-sub"> (the domain itself)</span> : null}</span>
                    <span className="adm-cell-sub">Value</span><code style={{ wordBreak: "break-all" }}>{c.add.value}</code>
                  </div>
                  <div style={{ marginTop: 8 }}><Button size="sm" onClick={() => copy(c.add!.value)}>Copy value</Button></div>
                </div>
              ) : null}
              {c.steps ? <ol style={{ margin: "8px 0 0 18px", padding: 0, fontSize: 13, lineHeight: 1.6, listStyle: "decimal" }}>{c.steps.map((s) => <li key={s}>{s}</li>)}</ol> : null}
            </div>
          ))}
          <div className="adm-cell-sub" style={{ marginTop: 14 }}>Incoming mail (MX) for {dns.domain}: {dns.mx.status === "ok" ? dns.mx.records.join(", ") : "none found"}</div>
        </div>
      ))}
    </Card>
  );
}

// ── The page ─────────────────────────────────────────────────────────────────────────

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<MailProfile>("orders");
  const [data, setData] = useState<RoutingData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[] | null>(null);

  const loadRouting = useCallback(() => {
    fetch("/api/admin/settings/mail-routing", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d; })
      .then((d) => { setData(d); setDataError(null); })
      .catch((e) => setDataError(e.message));
  }, []);
  const loadLogs = useCallback(() => fetch("/api/admin/email-logs", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setLogs(d?.logs ?? [])).catch(() => setLogs([])), []);
  useEffect(() => { loadRouting(); loadLogs(); }, [loadRouting, loadLogs]);

  const label = (id: string) => data?.categories.find((c) => c.id === id)?.label ?? "";
  const profile = (id: MailProfile) => data?.profiles.find((p) => p.id === id);

  return (
    <>
      <PageHeader eyebrow="Settings" title="Email (SMTP)" description="Your emails can be sent from two mailboxes — Orders and Support. Set each one up, then choose which one sends what." />
      {dataError ? <Alert>Couldn&apos;t load the mailbox overview ({dataError}).</Alert> : null}

      <Card title="Your mailboxes">
        <div className="adm-actions" style={{ marginBottom: 6, flexWrap: "wrap" }}>
          <div className="adm-seg" role="group" aria-label="Choose a mailbox to edit">
            {MAIL_PROFILES.map((p) => <button key={p} type="button" aria-pressed={tab === p} onClick={() => setTab(p)}>{PROFILE_LABEL[p]}</button>)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "10px 0 4px" }}>
          {MAIL_PROFILES.map((p) => {
            const i = profile(p);
            return (
              <span key={p} className="adm-cell-sub" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Badge tone={!i?.configured ? "neutral" : i.enabled ? "success" : "warn"}>{!i?.configured ? "Not set up" : i.enabled ? "In use" : "Paused"}</Badge>
                {PROFILE_LABEL[p]}{i?.fromEmail ? <> — <b>{i.fromEmail}</b></> : null}
              </span>
            );
          })}
        </div>
        <MailboxEditor key={tab} profile={tab} info={profile(tab)} onSaved={() => { loadRouting(); }} />
      </Card>

      <div style={{ height: 16 }} />
      {data ? <RoutingCard data={data} reload={loadRouting} /> : !dataError ? <Card title="Which mailbox sends what"><p className="adm-cell-sub">Loading…</p></Card> : null}

      <div style={{ height: 16 }} />
      <DnsCard toastCopy={(t) => toast(t)} />

      <div style={{ height: 16 }} />
      <Card title="Recent emails" actions={<Button size="sm" onClick={loadLogs}>Refresh</Button>}>
        <p className="adm-cell-sub" style={{ marginBottom: 10 }}>Every email the site tried to send, and which mailbox it went through. &quot;Sent&quot; means the mail server accepted it — if a customer says it didn&apos;t arrive, ask them to check Spam and look at the delivery check above. &quot;Skipped&quot; means email isn&apos;t set up (or is switched off); &quot;Failed&quot; shows why.</p>
        {logs === null ? <p className="adm-cell-sub">Loading…</p> : logs.length === 0 ? <p className="adm-cell-sub">Nothing sent yet.</p> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th scope="col">When</th><th scope="col">To</th><th scope="col">Email</th><th scope="col">Sent from</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{when(l.at)}</td>
                    <td>{l.to}</td>
                    <td>{l.subject}{label(l.category) ? <div className="adm-cell-sub">{label(l.category)}</div> : null}</td>
                    <td>{l.from || <span className="adm-cell-sub">—</span>}</td>
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
