"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import { DELETE_CONFIRM_PHRASE } from "@/lib/account-delete";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/** Type DELETE + enter your password -> POST /api/account/delete (soft delete), then leave for the home page. */
export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ confirm?: string; password?: string; form?: string }>({});

  const ready = confirm === DELETE_CONFIRM_PHRASE && password.length > 0;

  // Focus the first field, lock page scroll, restore both on close.
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  const submit = async () => {
    if (busy) return;
    if (confirm !== DELETE_CONFIRM_PHRASE) { setErr({ confirm: `Type ${DELETE_CONFIRM_PHRASE} in capital letters to confirm` }); return; }
    if (!password) { setErr({ password: "Enter your password" }); return; }
    setBusy(true);
    setErr({});
    try {
      const res = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm, password }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr({ password: d.issues?.password?.[0], confirm: d.issues?.confirm?.[0], form: d.issues ? undefined : d.error || "Could not delete your account." });
        setBusy(false);
        return;
      }
      window.location.assign("/"); // hard navigation: drops every bit of signed-in client state
    } catch {
      setErr({ form: "Network error. Nothing was deleted." });
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !busy) { e.stopPropagation(); onClose(); return; }
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); void submit(); return; }
    if (e.key !== "Tab") return;
    const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="pf-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div ref={dialogRef} className="pf-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <div className="pf-modal-h">
          <h2 id={titleId}>Delete my account</h2>
          <button type="button" className="pf-x" aria-label="Close" onClick={onClose} disabled={busy}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" /></svg>
          </button>
        </div>
        <div className="pf-modal-b">
          <p><b>This can&apos;t be undone from your side.</b> If you go ahead:</p>
          <ul>
            <li>you&apos;ll be signed out and won&apos;t be able to log in with this account again;</li>
            <li>your profile photo is removed;</li>
            <li>past orders are kept by us for accounting;</li>
            <li>you can register again later with the same email.</li>
          </ul>
          {err.form ? <p role="alert" style={{ color: "#b42318", fontWeight: 700 }}>{err.form}</p> : null}
          <div className="acct-field">
            <label htmlFor="pf-del-confirm">Type {DELETE_CONFIRM_PHRASE} to confirm</label>
            <input ref={confirmRef} id="pf-del-confirm" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={confirm} onChange={(e) => { setConfirm(e.target.value); setErr((x) => ({ ...x, confirm: undefined })); }} aria-invalid={err.confirm ? true : undefined} placeholder={DELETE_CONFIRM_PHRASE} />
            {err.confirm ? <em>{err.confirm}</em> : null}
          </div>
          <div className="acct-field">
            <label htmlFor="pf-del-password">Your password</label>
            <input id="pf-del-password" type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErr((x) => ({ ...x, password: undefined })); }} aria-invalid={err.password ? true : undefined} />
            {err.password ? <em>{err.password}</em> : null}
          </div>
        </div>
        <div className="pf-modal-f">
          <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={onClose} disabled={busy}>Keep my account</button>
          <button type="button" className="cv-btn cv-btn-danger-solid cv-btn-sm" onClick={() => void submit()} disabled={!ready || busy} data-testid="pf-del-submit">{busy ? "Deleting…" : "Delete my account"}</button>
        </div>
      </div>
    </div>
  );
}
