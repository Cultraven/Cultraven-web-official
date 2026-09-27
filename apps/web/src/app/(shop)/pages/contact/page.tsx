"use client";
import React, { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "Order Issue", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      <div style={{ backgroundColor: "#172545", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.75rem" }}>GET IN TOUCH</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 1 }}>Contact Us</h1>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "rgba(245,241,232,0.6)", marginTop: "1rem" }}>We respond within 24 hours on business days.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }} className="contact-grid">
        {/* Contact Info */}
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#172545", marginBottom: "2rem" }}>How can we help?</h2>
          {[
            { icon: "✉️", label: "Email", value: "support@cultraven.com", href: "mailto:support@cultraven.com" },
            { icon: "📸", label: "Instagram", value: "@cultraven", href: "https://instagram.com/cultraven" },
            { icon: "🕐", label: "Hours", value: "Mon–Sat · 10 AM – 6 PM IST", href: null },
          ].map((c) => (
            <div key={c.label} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "2rem" }}>
              <span style={{ fontSize: "1.25rem", marginTop: "2px" }}>{c.icon}</span>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.25rem" }}>{c.label}</p>
                {c.href ? (
                  <a href={c.href} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", textDecoration: "underline" }}>{c.value}</a>
                ) : (
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#4B5563" }}>{c.value}</p>
                )}
              </div>
            </div>
          ))}

          <div style={{ marginTop: "3rem", backgroundColor: "#EAE6DB", padding: "2rem" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.75rem" }}>QUICK LINKS</p>
            {[{ label: "Track Your Order", href: "/account/orders" }, { label: "Size Guide", href: "/size-guide" }, { label: "Returns & Exchanges", href: "/returns" }, { label: "FAQ", href: "/faq" }].map((l) => (
              <a key={l.href} href={l.href} style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#172545", textDecoration: "none", padding: "0.4rem 0", borderBottom: "1px solid #D9D3C4" }}>{l.label} →</a>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          {sent ? (
            <div style={{ backgroundColor: "#172545", padding: "3rem", textAlign: "center" }}>
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>✓</p>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#F5F1E8", marginBottom: "0.75rem" }}>Message sent.</h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "rgba(245,241,232,0.65)" }}>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[{ id: "name", label: "YOUR NAME", type: "text", placeholder: "Rohan Sharma" }, { id: "email", label: "EMAIL ADDRESS", type: "email", placeholder: "you@email.com" }].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>{field.label}</label>
                  <input id={field.id} type={field.type} required placeholder={field.placeholder} value={form[field.id as "name" | "email"]} onChange={(e) => setForm({ ...form, [field.id]: e.target.value })} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label htmlFor="subject" style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>SUBJECT</label>
                <select id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }}>
                  {["Order Issue", "Return / Exchange", "Size Query", "Product Question", "Wholesale Enquiry", "Collaboration", "Other"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="message" style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>MESSAGE</label>
                <textarea id="message" required rows={6} placeholder="Tell us how we can help..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button type="submit" disabled={loading} style={{ padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1 }}>
                {loading ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
