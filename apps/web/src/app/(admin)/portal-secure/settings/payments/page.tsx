"use client";
/**
 * Admin · Payments (Razorpay). Keys are stored encrypted in MongoDB and win over the server's .env values.
 * The Key Secret and Webhook secret are never sent back to the browser: leave a field blank to keep the saved one.
 */
import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Field, PageHeader, Switch, useToast } from "@/components/admin/ui";

interface Status {
  keyId: string;
  hasSecret: boolean;
  hasWebhookSecret: boolean;
  enabled: boolean;
  mode: "test" | "live" | null;
  source: "admin" | "env" | "none";
  online: boolean;
  envConfigured: boolean;
  envKeyId: string;
  envHasWebhookSecret: boolean;
}

const KEY_ID = /^rzp_(test|live)_[A-Za-z0-9]{6,40}$/;
const modeOf = (id: string): "test" | "live" | null => (id.startsWith("rzp_test_") ? "test" : id.startsWith("rzp_live_") ? "live" : null);

export default function PaymentsSettingsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [origin, setOrigin] = useState("");

  const apply = (s: Status) => { setStatus(s); setKeyId(s.keyId); setEnabled(s.enabled); };

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/admin/settings/razorpay", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d as Status; })
      .then((s) => { apply(s); setLoaded(true); })
      .catch((e) => { setLoadError(e.message); setLoaded(true); });
  }, []);

  const typedMode = modeOf(keyId.trim());
  const idLooksValid = KEY_ID.test(keyId.trim());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!idLooksValid) { toast("Key ID must start with rzp_test_ or rzp_live_", "error"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings/razorpay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, keyId: keyId.trim(), keySecret: keySecret || undefined, webhookSecret: webhookSecret || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setKeySecret(""); setWebhookSecret("");
      if (d.settings) apply(d.settings);
      toast("Payment settings saved");
    } catch (err: any) { toast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const body: Record<string, string> = {};
      if (keyId.trim()) body.keyId = keyId.trim();
      if (keySecret) body.keySecret = keySecret;
      const r = await fetch("/api/admin/settings/razorpay/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      setResult({ ok: r.ok && d.ok, text: d.message || d.error || `HTTP ${r.status}` });
    } catch { setResult({ ok: false, text: "Network error" }); }
    finally { setTesting(false); }
  };

  const live = status?.online;
  const sourceNote =
    status?.source === "admin" ? "Using the keys saved on this page."
    : status?.source === "env" ? `Using the keys from the server environment (${status.envKeyId || "RAZORPAY_KEY_ID"}). Save keys here to override them.`
    : "No keys yet: customers can only choose Cash on Delivery.";

  return (
    <>
      <PageHeader eyebrow="Settings" title="Payments" description="Connect Razorpay so customers can pay online (UPI, cards, netbanking). Cash on Delivery always stays available." />
      {loadError ? <Alert>Couldn&apos;t load settings ({loadError}).</Alert> : null}

      <Card title="Status">
        <div className="adm-actions" style={{ alignItems: "center" }}>
          {!loaded ? <Badge>Loading…</Badge>
            : live ? <Badge tone="success">Online payments ON{status?.mode ? ` · ${status.mode} mode` : ""}</Badge>
            : status && !status.enabled ? <Badge tone="warn">Switched off</Badge>
            : <Badge tone="warn">Not configured</Badge>}
          <span className="adm-cell-sub">{loaded ? sourceNote : ""}</span>
        </div>
      </Card>

      <div style={{ height: 16 }} />
      <form onSubmit={save} noValidate>
        <Card title="Razorpay keys">
          <div className="adm-grid adm-grid-2">
            <Field label="Key ID" hint={typedMode ? (typedMode === "live" ? "LIVE mode: real money will be charged." : "Test mode: no real money moves.") : "From Razorpay Dashboard → Account & Settings → API Keys. Starts with rzp_test_ or rzp_live_."} required>
              <input className="adm-input" value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_test_xxxxxxxxxxxxxx" autoComplete="off" spellCheck={false} />
            </Field>
            <Field label="Key Secret" hint={status?.hasSecret ? "A secret is saved. Leave blank to keep it." : "Shown once by Razorpay when you generate the key."} required={!status?.hasSecret}>
              <input className="adm-input" type="password" value={keySecret} onChange={(e) => setKeySecret(e.target.value)} placeholder={status?.hasSecret ? "••••••••  (saved)" : ""} autoComplete="new-password" spellCheck={false} />
            </Field>
            <Field label="Webhook secret" hint={status?.hasWebhookSecret ? "A webhook secret is saved. Leave blank to keep it." : status?.envHasWebhookSecret ? "Optional: the server environment already has one." : "Recommended. Used to confirm payments even if the customer closes the tab."} span>
              <input className="adm-input" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder={status?.hasWebhookSecret ? "••••••••  (saved)" : ""} autoComplete="new-password" spellCheck={false} />
            </Field>
          </div>
          <div className="adm-row" style={{ marginTop: 14 }}>
            <div className="adm-row-main"><b>Enable online payments</b><div className="adm-cell-sub">Turn off to hide online payment at checkout (e.g. while changing keys). Payments already in progress still complete.</div></div>
            <Switch checked={enabled} onChange={setEnabled} label="Enable online payments" />
          </div>
        </Card>

        <div className="adm-actions" style={{ marginTop: 16 }}>
          <Button type="submit" variant="primary" loading={saving} disabled={!loaded}>Save settings</Button>
          <Button onClick={test} loading={testing} disabled={!loaded || (!keySecret && !status?.hasSecret && !status?.envConfigured)}>Test connection</Button>
        </div>
        {result ? <div style={{ marginTop: 12 }}><Alert kind={result.ok ? "success" : "error"}>{result.text}</Alert></div> : null}
        <p className="adm-cell-sub" style={{ marginTop: 10 }}>
          Test connection checks the Key Secret you typed, or the saved keys if the field is blank. It only reads from Razorpay: nothing is charged.
          Secrets are encrypted before they are stored and are never shown here again.
        </p>
      </form>

      <div style={{ height: 16 }} />
      <Card title="Webhook (recommended)">
        <p className="adm-cell-sub" style={{ marginBottom: 10 }}>
          In Razorpay Dashboard → Webhooks, add this URL, tick <b>payment.captured</b> and <b>payment.failed</b>, and enter the same secret as above.
        </p>
        <input className="adm-input" readOnly value={origin ? `${origin}/api/razorpay/webhook` : "/api/razorpay/webhook"} aria-label="Webhook URL" onFocus={(e) => e.currentTarget.select()} />
      </Card>
    </>
  );
}
