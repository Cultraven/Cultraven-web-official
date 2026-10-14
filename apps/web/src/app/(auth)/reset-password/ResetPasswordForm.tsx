"use client";
import React, { useState } from "react";
import Link from "next/link";

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "A number", test: (v) => /\d/.test(v) },
];

const labelStyle = { display: "block", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.45rem" } as const;
const inputStyle = (bad: boolean) => ({ width: "100%", minHeight: "48px", padding: "0.9rem 4.5rem 0.9rem 1rem", border: `2px solid ${bad ? "var(--color-crimson)" : "var(--color-navy)"}`, backgroundColor: "var(--color-cream)", fontFamily: "var(--font-sans)", fontSize: "1rem", color: "var(--color-navy)", outline: "none", boxSizing: "border-box" }) as const;

export default function ResetPasswordForm({ token, invite }: { token: string; invite: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null); // where to sign in

  const allRules = RULES.every((r) => r.test(password));
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!allRules) return setError("Your password needs every item in the list below.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setDone(typeof data.loginPath === "string" ? data.loginPath : "/login");
      else setError(data.error || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div role="status" style={{ textAlign: "center", padding: "2rem 1.5rem", backgroundColor: "rgba(23,37,84,0.04)", border: "2px solid var(--color-navy)" }}>
        <div style={{ width: "52px", height: "52px", backgroundColor: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "3px 3px 0px var(--color-lava)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true"><polyline points="4,12 10,18 20,6" /></svg>
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "0.75rem" }}>{invite ? "PASSWORD SET" : "PASSWORD UPDATED"}</h2>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          You can sign in with your new password now. We&apos;ve also sent you an email to confirm the change.
        </p>
        <Link href={done} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "48px", padding: "0 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", boxShadow: "3px 3px 0px var(--color-lava)" }}>
          SIGN IN
        </Link>
      </div>
    );
  }

  const toggle = (
    <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide passwords" : "Show passwords"} style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", minHeight: "44px", minWidth: "44px", padding: "0 0.6rem", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-navy)" }}>
      {show ? "Hide" : "Show"}
    </button>
  );

  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <label htmlFor="new-password" style={labelStyle}>New password</label>
        <div style={{ position: "relative" }}>
          <input id="new-password" type={show ? "text" : "password"} autoComplete="new-password" required value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} disabled={loading} maxLength={72} style={inputStyle(false)} />
          {toggle}
        </div>
        <ul aria-label="Password rules" style={{ listStyle: "none", margin: "0.6rem 0 0", padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li key={r.label} style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: ok ? "var(--color-navy)" : "var(--color-gray)" }}>
                <span aria-hidden="true">{ok ? "✓" : "○"}</span> {r.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label htmlFor="confirm-password" style={labelStyle}>Confirm password</label>
        <input id="confirm-password" type={show ? "text" : "password"} autoComplete="new-password" required value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} disabled={loading} maxLength={72} aria-invalid={mismatch} style={{ ...inputStyle(mismatch), paddingRight: "1rem" }} />
        {mismatch && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-crimson)", marginTop: "4px" }}>The two passwords don&apos;t match.</p>}
      </div>

      {error && <p role="alert" style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-crimson)", margin: 0 }}>{error}</p>}

      <button type="submit" disabled={loading} style={{ width: "100%", minHeight: "52px", padding: "1rem", backgroundColor: loading ? "rgba(23,37,84,0.5)" : "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "2px solid var(--color-navy)", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "4px 4px 0px 0px var(--color-lava)" }}>
        {loading ? "SAVING..." : invite ? "SET PASSWORD" : "UPDATE PASSWORD"}
      </button>
    </form>
  );
}
