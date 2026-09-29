/**
 * CookieConsentBanner — GDPR/IT Act compliance.
 * Shown once; consent saved to localStorage.
 * Activates GA4 + Meta Pixel only after user consents.
 */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "cultraven_cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {/* ignore */}
    setVisible(false);
    // Fire analytics init events now that user has consented
    window.dispatchEvent(new CustomEvent("cookie_consent", { detail: { accepted: true } }));
  };

  const decline = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "declined");
    } catch {/* ignore */}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: "#172545",
        color: "#F5F1E8",
        padding: "1.25rem clamp(1.25rem,4vw,5rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        flexWrap: "wrap",
        borderTop: "2px solid #C94227",
        animation: "slideUpConsent 0.3s ease",
      }}
    >
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "0.82rem",
          lineHeight: 1.6,
          color: "rgba(245,241,232,0.85)",
          maxWidth: "680px",
        }}
      >
        We use cookies to enhance your shopping experience, analyze site traffic, and serve personalized content. By clicking{" "}
        <strong style={{ color: "#F5F1E8" }}>&ldquo;Accept All&rdquo;</strong>, you agree to our{" "}
        <Link
          href="/pages/privacy"
          style={{ color: "#C94227", textDecoration: "underline", fontWeight: 600 }}
        >
          Privacy Policy
        </Link>
        .
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0, flexWrap: "wrap" }}>
        <button
          id="cookie-decline-btn"
          onClick={decline}
          style={{
            padding: "0.625rem 1.5rem",
            backgroundColor: "transparent",
            color: "rgba(245,241,232,0.7)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "1.5px solid rgba(245,241,232,0.3)",
            cursor: "pointer",
            transition: "border-color 0.2s ease, color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,241,232,0.7)";
            (e.currentTarget as HTMLButtonElement).style.color = "#F5F1E8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,241,232,0.3)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,241,232,0.7)";
          }}
        >
          Decline
        </button>
        <button
          id="cookie-accept-btn"
          onClick={accept}
          style={{
            padding: "0.625rem 1.75rem",
            backgroundColor: "#C94227",
            color: "#F5F1E8",
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "1.5px solid #C94227",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a8361f";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C94227";
          }}
        >
          Accept All
        </button>
      </div>

      <style>{`
        @keyframes slideUpConsent {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
