"use client";
/**
 * /account/addresses — the signed-in customer's saved delivery addresses, stored in MongoDB
 * (GET/POST /api/account/addresses, PUT/DELETE /api/account/addresses/<id>).
 */
import React, { useCallback, useEffect, useState } from "react";

interface Addr { id: string; label: string; name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"];
const EMPTY = { label: "Home", name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "", isDefault: false };

export default function AddressesPage() {
  const [list, setList] = useState<Addr[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/account/addresses", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); setList(d.addresses); setError(null); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(null), 2800); };
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm((f) => f && { ...f, [k]: e.target.value }); setErrs((x) => ({ ...x, [k]: "" })); };

  const validate = (f: typeof EMPTY) => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Full name is required";
    if (!f.line1.trim()) e.line1 = "Address is required";
    if (!f.city.trim()) e.city = "City is required";
    if (!f.state) e.state = "Choose a state";
    if (!/^\d{6}$/.test(f.pincode)) e.pincode = "Enter a 6-digit pincode";
    if (!/^\d{10}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit phone number";
    return e;
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    const e = validate(form);
    setErrs(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErrs(d.issues ? Object.fromEntries(Object.entries(d.issues).map(([k, v]) => [k, (v as string[])[0]])) : { _: d.error || "Could not save" }); }
      else { setForm(null); setEditingId(null); flash(editingId ? "Address updated" : "Address saved"); load(); }
    } catch { setErrs({ _: "Network error — nothing was saved." }); }
    setSaving(false);
  };

  const makeDefault = async (id: string) => { await fetch(`/api/account/addresses/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setDefault: true }) }); flash("Default address updated"); load(); };
  const remove = async (id: string) => { const r = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" }); setConfirmId(null); if (r.ok) { flash("Address deleted"); load(); } else setError("Could not delete the address"); };
  const edit = (a: Addr) => { setEditingId(a.id); setForm({ label: a.label, name: a.name, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, phone: a.phone, isDefault: a.isDefault }); setErrs({}); };

  const Field = ({ k, label, full, children }: { k: keyof typeof EMPTY; label: string; full?: boolean; children: React.ReactNode }) => (
    <div className={`acct-field ${full ? "full" : ""}`}><label>{label}</label>{children}{errs[k] ? <em>{errs[k]}</em> : null}</div>
  );

  return (
    <>
      <header className="acct-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <span className="acct-eyebrow">My account</span>
          <h1 className="acct-title">Addresses</h1>
          <p className="acct-sub">Save where to deliver — checkout gets faster.</p>
        </div>
        {!form ? <button type="button" className="cv-btn cv-btn-lava cv-btn-sm" onClick={() => { setForm({ ...EMPTY }); setEditingId(null); setErrs({}); }}>+ Add address</button> : null}
      </header>

      {notice ? <p role="status" style={{ background: "#e6f6ec", color: "#15803d", border: "2px solid #15803d", padding: "0.7rem 1rem", fontWeight: 800, marginBottom: "1rem" }}>{notice}</p> : null}
      {error ? <p role="alert" style={{ color: "#b42318", fontWeight: 700, marginBottom: "1rem" }}>{error}</p> : null}

      {form ? (
        <form onSubmit={save} className="acct-card" style={{ marginBottom: "2rem" }} noValidate>
          <div className="acct-card-h"><h3>{editingId ? "Edit address" : "New address"}</h3></div>
          <div className="acct-card-b">
            {errs._ ? <p role="alert" style={{ color: "#b42318", fontWeight: 700, marginBottom: "1rem" }}>{errs._}</p> : null}
            <div className="acct-form">
              <Field k="label" label="Label"><select value={form.label} onChange={set("label")}><option>Home</option><option>Work</option><option>Other</option></select></Field>
              <Field k="name" label="Full name"><input value={form.name} onChange={set("name")} autoComplete="name" /></Field>
              <Field k="line1" label="Address line 1" full><input value={form.line1} onChange={set("line1")} autoComplete="address-line1" /></Field>
              <Field k="line2" label="Address line 2 (optional)" full><input value={form.line2} onChange={set("line2")} autoComplete="address-line2" /></Field>
              <Field k="city" label="City"><input value={form.city} onChange={set("city")} autoComplete="address-level2" /></Field>
              <Field k="state" label="State"><select value={form.state} onChange={set("state")}><option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field k="pincode" label="Pincode"><input inputMode="numeric" maxLength={6} value={form.pincode} onChange={set("pincode")} autoComplete="postal-code" /></Field>
              <Field k="phone" label="Phone"><input inputMode="tel" maxLength={10} value={form.phone} onChange={set("phone")} autoComplete="tel-national" /></Field>
              <label className="full" style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800, fontSize: "0.8rem", color: "var(--color-navy)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => f && { ...f, isDefault: e.target.checked })} /> Make this my default address
              </label>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
              <button type="submit" className="cv-btn cv-btn-navy cv-btn-sm" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Save address"}</button>
              <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => { setForm(null); setEditingId(null); }}>Cancel</button>
            </div>
          </div>
        </form>
      ) : null}

      {list === null && !error ? (
        <div className="acct-addr-grid">{[0, 1].map((i) => <div key={i} className="skel" style={{ height: 190 }} />)}</div>
      ) : list && list.length === 0 && !form ? (
        <div className="acct-card">
          <div className="acct-empty">
            <div className="acct-empty-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
            <h3>No saved addresses</h3>
            <p>Add your delivery address once and skip the typing at checkout.</p>
            <button type="button" className="cv-btn cv-btn-navy" onClick={() => { setForm({ ...EMPTY }); setErrs({}); }}>Add your first address</button>
          </div>
        </div>
      ) : (
        <div className="acct-addr-grid">
          {list?.map((a) => (
            <article key={a.id} className={`acct-addr ${a.isDefault ? "is-default" : ""}`}>
              <h4>{a.label}{a.isDefault ? <span className="acct-chip is-ok">Default</span> : null}</h4>
              <p><b>{a.name}</b><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br /><span style={{ color: "var(--color-smoke)" }}>{a.phone}</span></p>
              <div className="acct-addr-actions">
                {confirmId === a.id ? (
                  <>
                    <button type="button" className="cv-btn cv-btn-danger cv-btn-sm" onClick={() => remove(a.id)}>Yes, delete</button>
                    <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => setConfirmId(null)}>Keep</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => edit(a)}>Edit</button>
                    {!a.isDefault ? <button type="button" className="cv-btn cv-btn-outline cv-btn-sm" onClick={() => makeDefault(a.id)}>Set default</button> : null}
                    <button type="button" className="cv-btn cv-btn-danger cv-btn-sm" onClick={() => setConfirmId(a.id)}>Delete</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
