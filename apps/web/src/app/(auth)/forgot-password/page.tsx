"use client";
/**
 * Forgot Password — /forgot-password
 * Submits email to /api/auth/forgot-password.
 * Shows success message regardless (prevents email enumeration).
 */
import React, { useState } from "react";
import Link from "next/link";

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
      // Always show success — prevents email enumeration
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "440px", width: "100%", backgroundColor: "#FFFFFF", padding: "clamp(2.5rem,5vw,4rem)", border: "1px solid #D9D3C4" }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", color: "#172545", textTransform: "uppercase", marginBottom: "1rem" }}>CULTRAVEN</h1>
          </Link>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2rem", color: "#172545" }}>Reset Password</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>Enter your email and we&apos;ll send a reset link.</p>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "1.5rem", backgroundColor: "rgba(23,37,69,0.05)", border: "1px solid rgba(23,37,69,0.15)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✉️</div>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "#172545", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>CHECK YOUR INBOX</h3>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.6 }}>
              If an account with <strong style={{ color: "#172545" }}>{email}</strong> exists, you&apos;ll receive a password reset link within a few minutes. Check your spam folder if you don&apos;t see it.
            </p>
            <Link
              href="/login"
              style={{ display: "inline-block", marginTop: "1.5rem", fontFamily: "Inter, sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#172545", textDecoration: "underline" }}
            >
              ← Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="forgot-email" style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>
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
                style={{ width: "100%", padding: "0.875rem 1rem", border: `1.5px solid ${error ? "#C94227" : "#D9D3C4"}`, backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }}
              />
              {error && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#C94227", marginTop: "0.3rem" }}>{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "1rem", backgroundColor: loading ? "#9fa8c0" : "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background-color 0.2s" }}
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>

            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#6B7280", textAlign: "center" }}>
              <Link href="/login" style={{ color: "#172545", fontWeight: 700, textDecoration: "underline" }}>← Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
