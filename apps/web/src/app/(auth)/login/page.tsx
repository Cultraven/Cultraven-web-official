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
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "440px", width: "100%", backgroundColor: "var(--color-cream)", padding: "clamp(2.5rem,5vw,4rem)", border: "var(--border-thick)", boxShadow: "var(--shadow-lg)" }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "1rem" }}>CULTRAVEN</h1>
          </Link>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", color: "var(--color-navy)", textTransform: "uppercase" }}>WELCOME BACK BRO</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "12px", color: "var(--color-gray)", marginTop: "0.5rem", textTransform: "uppercase" }}>LOG IN TO ACCESS YOUR ACCOUNT.</p>
        </div>

        <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="login-email" style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.5rem" }}>
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
              style={{ width: "100%", padding: "1rem", border: "2px solid var(--color-navy)", backgroundColor: "var(--color-cream)", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 800, color: "var(--color-navy)", outline: "none", boxSizing: "border-box", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <label htmlFor="login-password" style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)" }}>Password</label>
              <Link href="/forgot-password" style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, color: "var(--color-crimson)", textDecoration: "underline" }}>Forgot?</Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "1rem", border: "2px solid var(--color-navy)", backgroundColor: "var(--color-cream)", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 800, color: "var(--color-navy)", outline: "none", boxSizing: "border-box", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)" }}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--color-crimson)", fontWeight: 600, padding: "0.75rem 1rem", backgroundColor: "rgba(201,66,39,0.06)", border: "1px solid rgba(201,66,39,0.25)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "16px", fontSize: "14px", marginTop: "1rem" }}
          >
            {loading ? "RUK JA BRO..." : "ENTER CULTRAVEN"}
          </button>
        </form>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "var(--color-gray)", textAlign: "center", marginTop: "2rem" }}>
          NO ACCOUNT?{" "}
          <Link href="/register" style={{ color: "var(--color-navy)", fontWeight: 900, textDecoration: "underline" }}>CREATE ONE BRO</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-gray)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
