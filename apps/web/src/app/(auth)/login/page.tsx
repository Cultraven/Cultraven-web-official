"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirect } from "@/lib/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"), "/account");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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

  const INPUT: React.CSSProperties = {
    width: "100%",
    padding: "0.9rem 1rem",
    border: "2px solid var(--color-navy)",
    backgroundColor: "white",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9rem",
    color: "var(--color-navy)",
    outline: "none",
    boxSizing: "border-box",
    letterSpacing: "0.02em",
  };
  const LABEL: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-sans)",
    fontWeight: 900,
    fontSize: "0.62rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--color-navy)",
    marginBottom: "0.45rem",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: "var(--color-cream)" }} className="auth-layout">

      {/* ── Left: Brand panel ── */}
      <div style={{ backgroundColor: "var(--color-navy)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "3rem", position: "relative", overflow: "hidden" }} className="auth-brand-panel">
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(218,178,5,0.04) 60px, rgba(218,178,5,0.04) 61px)", pointerEvents: "none" }} />

        {/* Top bar: logo + back */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "inline-block", textDecoration: "none" }}>
            <Image src="/logo.png" alt="CULTRAVEN" width={80} height={80} style={{ objectFit: "contain", filter: "brightness(0) invert(1)", height: "80px", width: "auto" }} />
          </Link>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,241,232,0.55)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(245,241,232,0.2)", padding: "6px 14px", minHeight: "44px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="15 18 9 12 15 6"/></svg>
            Home
          </Link>
        </div>

        {/* Brand copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: "1.25rem" }}>CULTRAVEN INSIDER</p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,4vw,4rem)", fontWeight: 400, color: "var(--color-cream)", lineHeight: 1.05, textTransform: "uppercase", marginBottom: "1.5rem" }}>
            NOT MADE<br />TO BLEND IN.
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "rgba(245,241,232,0.6)", lineHeight: 1.7, maxWidth: "280px" }}>
            Sign in to track orders, save your wishlist, and get early access to every drop.
          </p>
        </div>

        {/* Bottom tag */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {["MADE IN INDIA", "260 GSM COTTON", "FREE RETURNS"].map((tag) => (
            <span key={tag} style={{ fontFamily: "var(--font-sans)", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,241,232,0.4)", borderTop: "1px solid rgba(245,241,232,0.2)", paddingTop: "0.5rem" }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem clamp(2rem,5vw,5rem)", backgroundColor: "var(--color-cream)" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,4vw,3.5rem)", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", lineHeight: 1, marginBottom: "0.5rem" }}>
            WELCOME<br />BACK.
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-gray)", marginBottom: "2.5rem" }}>
            Log in to access your account
          </p>

          {redirect.startsWith("/checkout") ? (
            <p role="status" className="auth-gate">One last step — sign in or create an account to place your order. Your item is saved.</p>
          ) : null}
          <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label htmlFor="login-email" style={LABEL}>Email Address</label>
              <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder="you@example.com" style={{ ...INPUT, borderColor: error && !email ? "var(--color-crimson)" : "var(--color-navy)" }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.45rem" }}>
                <label htmlFor="login-password" style={{ ...LABEL, marginBottom: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-lava)", textDecoration: "underline", padding: "12px 0" }}>Forgot?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input id="login-password" type={showPw ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="••••••••" style={{ ...INPUT, paddingRight: "3rem" }} />
                <button type="button" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: "0", width: "44px", height: "44px", justifyContent: "center", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-gray)", padding: 0, display: "flex", alignItems: "center" }}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: "0.875rem 1rem", backgroundColor: "rgba(196,41,54,0.07)", border: "2px solid var(--color-crimson)", fontFamily: "var(--font-sans)", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-crimson)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "1.1rem", backgroundColor: loading ? "rgba(23,37,84,0.5)" : "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "2px solid var(--color-navy)", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "4px 4px 0px 0px var(--color-lava)", transition: "all 0.15s ease", marginTop: "0.5rem" }}
              onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0px 0px var(--color-lava)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? "none" : "4px 4px 0px 0px var(--color-lava)"; }}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)", textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link href={redirect === "/account" ? "/register" : `/register?redirect=${encodeURIComponent(redirect)}`} style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", color: "var(--color-navy)", fontWeight: 900, textDecoration: "none", borderBottom: "2px solid var(--color-lava)", paddingBottom: "1px" }}>
                CREATE ACCOUNT
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: "var(--font-sans)", color: "var(--color-gray)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>Loading…</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
