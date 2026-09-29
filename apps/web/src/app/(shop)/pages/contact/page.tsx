"use client";
/**
 * Contact Page — /pages/contact
 * Contact form with full validation + WhatsApp/Instagram CTA.
 */
import React, { useState } from "react";

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type Status = "idle" | "loading" | "success" | "error";

const SUBJECTS = [
  "Order Inquiry",
  "Return / Exchange",
  "Shipping Issue",
  "Product Question",
  "Payment Issue",
  "Feedback",
  "Other",
];

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim() || form.name.trim().length < 2) errors.name = "Enter your full name";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address";
  if (form.phone && form.phone.replace(/\D/g, "").length !== 10) errors.phone = "Enter a valid 10-digit phone number";
  if (!form.subject) errors.subject = "Please select a subject";
  if (!form.message.trim() || form.message.trim().length < 20) errors.message = "Message must be at least 20 characters";
  return errors;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          subject: form.subject,
          message: form.message.trim(),
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  const FIELD_STYLE = (hasError?: string): React.CSSProperties => ({
    width: "100%",
    padding: "0.875rem 1rem",
    border: `1.5px solid ${hasError ? "#C94227" : "#D9D3C4"}`,
    backgroundColor: "#FFFFFF",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    color: "#172545",
    outline: "none",
  });

  const LABEL_STYLE: React.CSSProperties = {
    display: "block",
    fontFamily: "Inter, sans-serif",
    fontWeight: 800,
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#172545",
    marginBottom: "0.5rem",
  };

  const ERR_STYLE: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "0.72rem",
    color: "#C94227",
    marginTop: "0.35rem",
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          backgroundColor: "#172545",
          padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "0.75rem",
          }}
        >
          We&apos;re Here
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem,6vw,5rem)",
            fontWeight: 600,
            color: "#F5F1E8",
            lineHeight: 1,
          }}
        >
          Contact Us
        </h1>
      </div>

      <div
        style={{
          padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "start",
        }}
        className="contact-grid"
      >
        {/* Left: Form */}
        <div>
          {status === "success" ? (
            <div
              style={{
                padding: "3rem",
                backgroundColor: "#172545",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#C94227",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  color: "#F5F1E8",
                  marginBottom: "0.75rem",
                }}
              >
                Message received.
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.82rem",
                  color: "rgba(245,241,232,0.65)",
                  lineHeight: 1.7,
                }}
              >
                Our team will get back to you within 24 hours during business days (Mon–Sat).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "2rem",
                  fontWeight: 600,
                  color: "#172545",
                  marginBottom: "2rem",
                }}
              >
                Send us a message
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Name */}
                <div>
                  <label htmlFor="contact-name" style={LABEL_STYLE}>Full Name *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Your full name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                    style={FIELD_STYLE(errors.name)}
                  />
                  {errors.name && <p id="contact-name-error" role="alert" style={ERR_STYLE}>{errors.name}</p>}
                </div>

                {/* Email + Phone row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="contact-row">
                  <div>
                    <label htmlFor="contact-email" style={LABEL_STYLE}>Email *</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={update("email")}
                      placeholder="you@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                      style={FIELD_STYLE(errors.email)}
                    />
                    {errors.email && <p id="contact-email-error" role="alert" style={ERR_STYLE}>{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" style={LABEL_STYLE}>Phone (optional)</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }));
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="10-digit number"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                      style={FIELD_STYLE(errors.phone)}
                    />
                    {errors.phone && <p id="contact-phone-error" role="alert" style={ERR_STYLE}>{errors.phone}</p>}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="contact-subject" style={LABEL_STYLE}>Subject *</label>
                  <select
                    id="contact-subject"
                    required
                    value={form.subject}
                    onChange={update("subject")}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                    style={{ ...FIELD_STYLE(errors.subject), appearance: "none", cursor: "pointer" }}
                  >
                    <option value="" disabled>Select a subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && <p id="contact-subject-error" role="alert" style={ERR_STYLE}>{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" style={LABEL_STYLE}>Message *</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={update("message")}
                    placeholder="Tell us how we can help..."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    style={{ ...FIELD_STYLE(errors.message), resize: "vertical", fontFamily: "Inter, sans-serif" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {errors.message
                      ? <p id="contact-message-error" role="alert" style={ERR_STYLE}>{errors.message}</p>
                      : <span />}
                    <p style={{ ...ERR_STYLE, color: form.message.length >= 20 ? "#6B7280" : "#9CA3AF" }}>
                      {form.message.length}/500
                    </p>
                  </div>
                </div>

                {status === "error" && (
                  <p role="alert" style={{ ...ERR_STYLE, fontSize: "0.82rem" }}>
                    Something went wrong. Please try again or reach us via WhatsApp.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    padding: "1.1rem",
                    backgroundColor: "#172545",
                    color: "#F5F1E8",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    opacity: status === "loading" ? 0.75 : 1,
                  }}
                >
                  {status === "loading" ? "SENDING..." : "SEND MESSAGE"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right: Info */}
        <div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontSize: "2rem",
              fontWeight: 600,
              color: "#172545",
              marginBottom: "2rem",
            }}
          >
            Faster ways to reach us
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
            {/* WhatsApp */}
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              id="contact-whatsapp-cta"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1.25rem",
                backgroundColor: "#EAE6DB",
                textDecoration: "none",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#D9D3C4")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#EAE6DB")}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#25D366",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "#172545", marginBottom: "3px" }}>
                  WhatsApp
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>
                  Fastest response — typically within 1 hour
                </p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/cultraven"
              target="_blank"
              rel="noopener noreferrer"
              id="contact-instagram-cta"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1.25rem",
                backgroundColor: "#EAE6DB",
                textDecoration: "none",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#D9D3C4")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#EAE6DB")}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="#FFFFFF" stroke="none" />
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "#172545", marginBottom: "3px" }}>
                  Instagram DM
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>
                  @cultraven — usually replies within a few hours
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:support@cultraven.com"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1.25rem",
                backgroundColor: "#EAE6DB",
                textDecoration: "none",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#D9D3C4")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#EAE6DB")}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#172545",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "#172545", marginBottom: "3px" }}>
                  Email
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>
                  support@cultraven.com — reply within 24 hours
                </p>
              </div>
            </a>
          </div>

          <div
            style={{
              backgroundColor: "#EAE6DB",
              padding: "1.25rem",
              borderLeft: "3px solid #172545",
            }}
          >
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#172545",
                marginBottom: "0.5rem",
              }}
            >
              Business Hours
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82rem",
                color: "#4B5563",
                lineHeight: 1.6,
              }}
            >
              Monday – Saturday: 10 AM – 6 PM IST<br />
              Sunday: Closed (WhatsApp monitored)
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .contact-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
