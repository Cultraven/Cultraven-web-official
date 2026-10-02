"use client";
/**
 * /account/addresses — the signed-in customer's saved delivery addresses, stored in MongoDB
 * (GET/POST /api/account/addresses, PUT/DELETE /api/account/addresses/<id>; max 10, enforced by the server).
 *
 * The form uses the same validators as the server (lib/address-validation): inline errors on blur and submit, first invalid
 * field focused, pincode autofill with state-consistency check, and "Use my current location".
 * Saved addresses that no longer pass today's rules are flagged "Needs update" with an Edit shortcut.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { canonicalState, firstAddressError, validateAddress } from "@/lib/address-validation";
import { AddressFields } from "@/components/address/AddressFields";
import { useAddressDraft, type AddressLabel } from "@/components/address/useAddressDraft";

interface Addr { id: string; label: string; name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }
const MAX_ADDRESSES = 10;
const asLabel = (l: string): AddressLabel => (l === "Work" || l === "Other" ? l : "Home");

export default function AddressesPage() {
  const [list, setList] = useState<Addr[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useAddressDraft();

  const load = useCallback(() => {
    fetch("/api/account/addresses", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(typeof d.error === "string" ? d.error : `HTTP ${r.status}`); setList(d.addresses); setError(null); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(null), 2800); };
  const full = (list?.length ?? 0) >= MAX_ADDRESSES;

  const checks = useMemo(() => new Map((list ?? []).map((a) => [a.id, validateAddress(a)] as const)), [list]);

  const openAdd = () => {
    if (full) { setError(`You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`); return; }
    form.reset();
    setEditingId(null); setIsDefault((list?.length ?? 0) === 0); setSummary(""); setError(null); setFormOpen(true);
  };
  const openEdit = (a: Addr) => {
    form.reset({ label: asLabel(a.label), name: a.name, phone: a.phone, pincode: a.pincode, city: a.city, state: canonicalState(a.state, a.pincode) ?? "", line1: a.line1, line2: a.line2 });
    form.showAllErrors();
    setEditingId(a.id); setIsDefault(a.isDefault); setSummary(""); setError(null); setFormOpen(true);
    requestAnimationFrame(() => document.getElementById("ad-name")?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };
  const closeForm = () => { setFormOpen(false); setEditingId(null); setSummary(""); };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    setSummary("");
    const r = form.validateAll();
    if (!r.ok) { setSummary(`Please fix ${Object.keys(r.errors).length === 1 ? "the highlighted field" : "the highlighted fields"} to save.`); return; }
    setSaving(true);
    try {
      const body = { label: form.draft.label, name: r.value.name, phone: r.value.phone, pincode: r.value.pincode, city: r.value.city, state: r.value.state, line1: r.value.line1, line2: r.value.line2, isDefault };
      const res = await fetch(editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        form.setServerErrors(d.issues);
        setSummary(typeof d.error === "string" ? d.error : "Could not save the address. Please try again.");
      } else {
        closeForm();
        flash(editingId ? "Address updated" : "Address saved");
        load();
      }
    } catch {
      setSummary("Network error — nothing was saved. Please try again.");
    }
    setSaving(false);
  };

  const makeDefault = async (id: string) => {
    const r = await fetch(`/api/account/addresses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setDefault: true }) });
    if (r.ok) { flash("Default address updated"); load(); } else setError("Could not update the default address");
  };
  const remove = async (id: string) => {
    const r = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    setConfirmId(null);
    if (r.ok) { flash("Address deleted"); load(); } else setError("Could not delete the address");
  };

  return (
    <>
      <header className="acct-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <span className="acct-eyebrow">My account</span>
          <h1 className="acct-title">Addresses</h1>
          <p className="acct-sub">Save where to deliver — checkout gets faster.</p>
        </div>
        {!formOpen ? <button type="button" className="cv-btn cv-btn-lava cv-btn-sm" onClick={openAdd} disabled={full} title={full ? `You can save up to ${MAX_ADDRESSES} addresses` : undefined}>+ Add address</button> : null}
      </header>

      {notice ? <p role="status" style={{ background: "#e6f6ec", color: "#15803d", border: "2px solid #15803d", padding: "0.7rem 1rem", fontWeight: 800, marginBottom: "1rem" }}>{notice}</p> : null}
      {error ? <p role="alert" style={{ color: "#b42318", fontWeight: 700, marginBottom: "1rem" }}>{error}</p> : null}
      {list ? <p className="af-count">{list.length} of {MAX_ADDRESSES} addresses saved{full ? " — delete one to add another" : ""}</p> : null}

      {formOpen ? (
        <form onSubmit={save} className="acct-card" style={{ marginBottom: "2rem" }} noValidate>
          <div className="acct-card-h"><h3>{editingId ? "Edit address" : "New address"}</h3></div>
          <div className="acct-card-b">
            <AddressFields f={form} idPrefix="ad" disabled={saving} />
            <label className="af-checkbox" style={{ marginTop: "1rem" }}>
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Make this my default address
            </label>
            {summary ? <p role="alert" className="af-summary" style={{ marginTop: "1rem" }}>{summary}</p> : null}
            <div className="af-form-actions" style={{ marginTop: "1.5rem" }}>
              <button type="submit" className="cv-btn cv-btn-navy cv-btn-sm" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Save address"}</button>
              <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={closeForm} disabled={saving}>Cancel</button>
            </div>
          </div>
        </form>
      ) : null}

      {list === null && !error ? (
        <div className="acct-addr-grid">{[0, 1].map((i) => <div key={i} className="skel" style={{ height: 190 }} />)}</div>
      ) : list && list.length === 0 && !formOpen ? (
        <div className="acct-card">
          <div className="acct-empty">
            <div className="acct-empty-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
            <h3>No saved addresses</h3>
            <p>Add your delivery address once and skip the typing at checkout.</p>
            <button type="button" className="cv-btn cv-btn-navy" onClick={openAdd}>Add your first address</button>
          </div>
        </div>
      ) : (
        <div className="acct-addr-grid">
          {list?.map((a) => {
            const chk = checks.get(a.id);
            const bad = !!chk && !chk.ok;
            return (
              <article key={a.id} className={`acct-addr ${a.isDefault ? "is-default" : ""} ${bad ? "is-invalid" : ""}`}>
                <h4>{a.label}{a.isDefault ? <span className="acct-chip is-ok">Default</span> : null}{bad ? <span className="acct-chip acct-bad-chip">Needs update</span> : null}</h4>
                <p><b>{a.name}</b><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br /><span style={{ color: "var(--color-smoke)" }}>{a.phone}</span></p>
                {bad && chk && !chk.ok ? <p className="acct-bad">{firstAddressError(chk.errors)}. Edit it so we can deliver here.</p> : null}
                <div className="acct-addr-actions af-acct-actions">
                  {confirmId === a.id ? (
                    <>
                      <button type="button" className="cv-btn cv-btn-danger cv-btn-sm" onClick={() => remove(a.id)}>Yes, delete</button>
                      <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => setConfirmId(null)}>Keep</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className={`cv-btn ${bad ? "cv-btn-lava" : "cv-btn-outline"} cv-btn-sm`} onClick={() => openEdit(a)}>{bad ? "Fix address" : "Edit"}</button>
                      {!a.isDefault ? <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => makeDefault(a.id)}>Set default</button> : null}
                      <button type="button" className="cv-btn cv-btn-danger cv-btn-sm" onClick={() => setConfirmId(a.id)}>Delete</button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
