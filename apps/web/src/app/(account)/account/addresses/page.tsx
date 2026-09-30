"use client";
/**
 * Addresses Page — /account/addresses
 * Manage delivery addresses for 1-click checkout.
 */
import React, { useState } from "react";
import type { Metadata } from "next";

interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

const MOCK_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    label: "Home",
    name: "Rohan Sharma",
    line1: "A-14, Hauz Khas Enclave",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110016",
    phone: "9876543210",
    isDefault: true,
  },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar","Chandigarh","Dadra & Nagar Haveli","Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const emptyForm = { label: "Home", name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "" };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name required";
    if (!form.line1.trim()) errs.line1 = "Address required";
    if (!form.city.trim()) errs.city = "City required";
    if (!form.state) errs.state = "State required";
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = "Valid 6-digit pincode required";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Valid 10-digit phone required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // API call placeholder
    if (editingId) {
      setAddresses((prev) => prev.map((a) => a.id === editingId ? { ...a, ...form } : a));
    } else {
      const newAddr: Address = { ...form, id: `addr-${Date.now()}`, isDefault: addresses.length === 0 };
      setAddresses((prev) => [...prev, newAddr]);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({ label: addr.label, name: addr.name, line1: addr.line1, line2: addr.line2 || "", city: addr.city, state: addr.state, pincode: addr.pincode, phone: addr.phone });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", padding: "0.75rem 1rem",
    border: `1.5px solid ${errors[field] ? "#C94227" : "#D9D3C4"}`,
    backgroundColor: "#F5F1E8", fontFamily: "var(--font-sans)", fontSize: "0.85rem",
    color: "#172545", outline: "none", boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-sans)", fontWeight: 700,
    fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#172545", marginBottom: "0.4rem",
  };

  return (
    <div style={{ padding: "clamp(2rem,5vw,4rem)", maxWidth: "760px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem,4vw,2.5rem)", color: "#172545", margin: 0 }}>
          Delivery Addresses
        </h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setErrors({}); }}
            style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#F5F1E8", backgroundColor: "#172545", border: "none", padding: "0.75rem 1.5rem", cursor: "pointer" }}
          >
            + ADD NEW ADDRESS
          </button>
        )}
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div style={{ backgroundColor: "#F5F1E8", border: "var(--border-thick)", boxShadow: "var(--shadow-md)", padding: "2rem", marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "1.5rem" }}>
            {editingId ? "EDIT ADDRESS" : "NEW ADDRESS"}
          </h2>
          <form onSubmit={handleSave} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Label */}
            <div>
              <label style={labelStyle}>Label</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["Home", "Work", "Other"].map((l) => (
                  <button key={l} type="button" onClick={() => setForm((p) => ({ ...p, label: l }))}
                    style={{ padding: "0.4rem 1rem", fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "1.5px solid #172545", cursor: "pointer", backgroundColor: form.label === l ? "#172545" : "transparent", color: form.label === l ? "#F5F1E8" : "#172545" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" autoComplete="name" value={form.name} onChange={update("name")} style={inputStyle("name")} />
                {errors.name && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "#C94227", marginTop: "0.25rem" }}>{errors.name}</p>}
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} style={inputStyle("phone")} placeholder="10-digit number" />
                {errors.phone && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "#C94227", marginTop: "0.25rem" }}>{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Address Line 1</label>
              <input type="text" autoComplete="address-line1" value={form.line1} onChange={update("line1")} style={inputStyle("line1")} placeholder="House/flat no., street, area" />
              {errors.line1 && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "#C94227", marginTop: "0.25rem" }}>{errors.line1}</p>}
            </div>

            <div>
              <label style={labelStyle}>Address Line 2 (Optional)</label>
              <input type="text" autoComplete="address-line2" value={form.line2} onChange={update("line2")} style={inputStyle("line2")} placeholder="Landmark, building name" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input type="text" autoComplete="address-level2" value={form.city} onChange={update("city")} style={inputStyle("city")} />
                {errors.city && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "#C94227", marginTop: "0.25rem" }}>{errors.city}</p>}
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <select value={form.state} onChange={update("state")} style={{ ...inputStyle("state"), appearance: "none" as const }}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "#C94227", marginTop: "0.25rem" }}>{errors.state}</p>}
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input type="text" inputMode="numeric" maxLength={6} value={form.pincode} onChange={update("pincode")} style={inputStyle("pincode")} placeholder="6-digit" />
                {errors.pincode && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", color: "#C94227", marginTop: "0.25rem" }}>{errors.pincode}</p>}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <button type="submit" disabled={saving} style={{ padding: "0.875rem 2rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "SAVING..." : editingId ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} style={{ padding: "0.875rem 1.5rem", backgroundColor: "transparent", color: "#172545", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", border: "2px solid #172545", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Address Cards ── */}
      {addresses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "#F5F1E8", border: "1px dashed #D9D3C4" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", color: "#172545", marginBottom: "0.5rem" }}>No addresses saved yet.</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "#6B7280" }}>Add an address for faster checkout.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {addresses.map((addr) => (
            <div key={addr.id} style={{ backgroundColor: "#F5F1E8", border: addr.isDefault ? "2px solid #172545" : "1px solid #D9D3C4", padding: "1.5rem", position: "relative" }}>
              {addr.isDefault && (
                <span style={{ position: "absolute", top: "1rem", right: "1rem", fontFamily: "var(--font-sans)", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F5F1E8", backgroundColor: "#172545", padding: "0.2rem 0.6rem" }}>
                  DEFAULT
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C94227" }}>{addr.label}</span>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem", color: "#172545", marginBottom: "0.25rem" }}>{addr.name}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.6 }}>
                {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                {addr.city}, {addr.state} — {addr.pincode}<br />
                📱 {addr.phone}
              </p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button onClick={() => handleEdit(addr)} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>EDIT</button>
                <button onClick={() => handleDelete(addr.id)} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C94227", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>DELETE</button>
                {!addr.isDefault && (
                  <button onClick={() => setDefault(addr.id)} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>SET DEFAULT</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
