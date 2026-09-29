"use client";
/**
 * Login Page — /login
 * Wrapped in Suspense to allow useSearchParams in production builds.
 */
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        const data = await res.json();
        if (typeof data.error === "object") {
          const firstError = Object.values(data.error)[0];
          setError(Array.isArray(firstError) ? firstError[0] : "Invalid credentials.");
        } else {
          setError(data.error || "Login failed. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please check your connection.");
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
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2rem", color: "#172545" }}>Welcome Back</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>Log in to access your account and orders.</p>
        </div>

        <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="login-email" style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <label htmlFor="login-password" style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545" }}>Password</label>
              <Link href="/forgot-password" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#6B7280", textDecoration: "underline" }}>Forgot?</Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#C94227", fontWeight: 600, padding: "0.75rem 1rem", backgroundColor: "rgba(201,66,39,0.06)", border: "1px solid rgba(201,66,39,0.25)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "1rem", backgroundColor: loading ? "#9fa8c0" : "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#6B7280", textAlign: "center", marginTop: "2rem" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#172545", fontWeight: 700, textDecoration: "underline" }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Inter, sans-serif", color: "#6B7280", fontSize: "0.8rem", letterSpacing: "0.1em" }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
