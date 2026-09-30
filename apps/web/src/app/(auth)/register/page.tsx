"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "Required";
    if (!form.lastName.trim()) errors.lastName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Valid email required";
    if (form.password.length < 8) errors.password = "Min 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errors.password = "Uppercase, lowercase & number required";
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords don't match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), password: form.password }),
      });
      if (res.ok) {
        router.push("/account");
        router.refresh();
      } else {
        const data = await res.json();
        if (data.issues) {
          const mapped: Record<string, string> = {};
          Object.entries(data.issues).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
          setFieldErrors(mapped);
        } else {
          setError(data.error || "Registration failed. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const inp = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "0.9rem 1rem",
    border: `2px solid ${fieldErrors[field] ? "var(--color-crimson)" : "var(--color-navy)"}`,
    backgroundColor: "white",
    fontFamily: "var(--font-sans)",
    fontSize: "0.88rem",
    color: "var(--color-navy)",
    outline: "none",
    boxSizing: "border-box",
  });
  const LABEL: React.CSSProperties = { display: "block", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.45rem" };
  const ERR: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, color: "var(--color-crimson)", marginTop: "4px", letterSpacing: "0.04em" };

  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: "var(--color-cream)" }} className="auth-layout">

      {/* ── Left: Brand panel ── */}
      <div style={{ backgroundColor: "var(--color-navy)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "3rem", position: "relative", overflow: "hidden" }} className="auth-brand-panel">
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(218,178,5,0.04) 60px, rgba(218,178,5,0.04) 61px)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "inline-block", textDecoration: "none" }}>
            <Image src="/logo.png" alt="CULTRAVEN" width={240} height={80} style={{ objectFit: "contain", filter: "brightness(0) invert(1)", height: "80px", width: "auto" }} />
          </Link>
          <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,241,232,0.55)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(245,241,232,0.2)", padding: "6px 12px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="15 18 9 12 15 6"/></svg>
            Home
          </Link>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-lava)", marginBottom: "1.25rem" }}>JOIN THE CULT</p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,4vw,4rem)", fontWeight: 400, color: "var(--color-cream)", lineHeight: 1.05, textTransform: "uppercase", marginBottom: "1.5rem" }}>
            THE CULTURE<br />STARTS HERE.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {[
              { icon: "✦", text: "Early access to every drop" },
              { icon: "✦", text: "10% off your first order" },
              { icon: "✦", text: "Track orders & manage returns" },
              { icon: "✦", text: "Save your wishlist forever" },
            ].map((p) => (
              <div key={p.text} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ color: "var(--color-lava)", fontSize: "0.7rem", marginTop: "2px", flexShrink: 0 }}>{p.icon}</span>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "rgba(245,241,232,0.72)", lineHeight: 1.4 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {["MADE IN INDIA", "260 GSM COTTON", "FREE RETURNS"].map((tag) => (
            <span key={tag} style={{ fontFamily: "var(--font-sans)", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,241,232,0.4)", borderTop: "1px solid rgba(245,241,232,0.2)", paddingTop: "0.5rem" }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem clamp(2rem,5vw,5rem)", backgroundColor: "var(--color-cream)", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "400px", paddingBlock: "1rem" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", lineHeight: 1.05, marginBottom: "0.5rem" }}>
            CREATE<br />ACCOUNT.
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-gray)", marginBottom: "2.5rem" }}>
            Join the movement. Get 10% off your first order.
          </p>

          <form onSubmit={handleRegister} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label htmlFor="reg-first" style={LABEL}>First Name</label>
                <input id="reg-first" type="text" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} disabled={loading} placeholder="Arjun" style={inp("firstName")} />
                {fieldErrors.firstName && <p style={ERR}>{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="reg-last" style={LABEL}>Last Name</label>
                <input id="reg-last" type="text" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} disabled={loading} placeholder="Mehta" style={inp("lastName")} />
                {fieldErrors.lastName && <p style={ERR}>{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" style={LABEL}>Email Address</label>
              <input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={update("email")} disabled={loading} placeholder="you@example.com" style={inp("email")} />
              {fieldErrors.email && <p style={ERR}>{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" style={LABEL}>Password</label>
              <div style={{ position: "relative" }}>
                <input id="reg-password" type={showPw ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={update("password")} disabled={loading} placeholder="Min 8 characters" style={{ ...inp("password"), paddingRight: "3rem" }} />
                <button type="button" onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-gray)", padding: 0, display: "flex", alignItems: "center" }}>
                  {showPw
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {fieldErrors.password
                ? <p style={ERR}>{fieldErrors.password}</p>
                : <p style={{ ...ERR, color: "var(--color-gray)" }}>Uppercase, lowercase &amp; number required</p>
              }
            </div>

            <div>
              <label htmlFor="reg-confirm" style={LABEL}>Confirm Password</label>
              <input id="reg-confirm" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update("confirmPassword")} disabled={loading} placeholder="••••••••" style={inp("confirmPassword")} />
              {fieldErrors.confirmPassword && <p style={ERR}>{fieldErrors.confirmPassword}</p>}
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
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT →"}
            </button>

            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.62rem", color: "var(--color-gray)", textAlign: "center", lineHeight: 1.7, letterSpacing: "0.04em" }}>
              By registering you agree to our{" "}
              <Link href="/pages/terms" style={{ color: "var(--color-navy)", textDecoration: "underline" }}>Terms</Link>{" & "}
              <Link href="/pages/privacy" style={{ color: "var(--color-navy)", textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>
          </form>

          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--color-line)", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" }}>
              Already a member?{" "}
              <Link href="/login" style={{ color: "var(--color-navy)", fontWeight: 900, textDecoration: "none", borderBottom: "2px solid var(--color-lava)", paddingBottom: "1px" }}>
                SIGN IN
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
