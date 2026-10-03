"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submitted) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "420px", width: "100%", backgroundColor: "white", padding: "clamp(2.5rem,5vw,3.5rem)", border: "2px solid var(--color-navy)", boxShadow: "6px 6px 0px 0px var(--color-navy)" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: "1.5rem" }}>
            <Image src="/logo.png" alt="CULTRAVEN" width={46} height={46} style={{ objectFit: "contain", height: "46px", width: "auto" }} />
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "0.5rem" }}>
            RESET<br />PASSWORD.
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>
            We&apos;ll send a reset link to your email.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "2rem 1.5rem", backgroundColor: "rgba(23,37,84,0.04)", border: "2px solid var(--color-navy)" }}>
            <div style={{ width: "52px", height: "52px", backgroundColor: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "3px 3px 0px var(--color-lava)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="square">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "0.75rem" }}>CHECK YOUR INBOX</h3>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              If an account with <strong style={{ color: "var(--color-navy)" }}>{email}</strong> exists, you&apos;ll receive a reset link shortly. Check your spam folder too.
            </p>
            <Link href="/login" style={{ display: "inline-block", padding: "0.75rem 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", boxShadow: "3px 3px 0px var(--color-lava)" }}>
              BACK TO LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="forgot-email" style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.45rem" }}>
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                disabled={loading}
                placeholder="you@example.com"
                style={{ width: "100%", padding: "0.9rem 1rem", border: `2px solid ${error ? "var(--color-crimson)" : "var(--color-navy)"}`, backgroundColor: "var(--color-cream)", fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }}
              />
              {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-crimson)", marginTop: "4px" }}>{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "1.1rem", backgroundColor: loading ? "rgba(23,37,84,0.5)" : "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "2px solid var(--color-navy)", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "4px 4px 0px 0px var(--color-lava)", transition: "all 0.15s ease" }}
              onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0px 0px var(--color-lava)"; }}}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? "none" : "4px 4px 0px 0px var(--color-lava)"; }}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-gray)", textAlign: "center" }}>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", color: "var(--color-navy)", textDecoration: "none", borderBottom: "2px solid var(--color-lava)", paddingBottom: "1px" }}>← Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
