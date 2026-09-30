"use client";
/**
 * Register Page — /register
 * Submits to /api/auth/register which sets a secure session cookie.
 */
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
    if (!form.firstName.trim()) errors.firstName = "First name required";
    if (!form.lastName.trim()) errors.lastName = "Last name required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Valid email required";
    if (form.password.length < 8) errors.password = "At least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errors.password = "Must contain uppercase, lowercase and a number";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
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
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      if (res.ok) {
        router.push("/account");
        router.refresh();
      } else {
        const data = await res.json();
        if (data.issues) {
          const mapped: Record<string, string> = {};
          Object.entries(data.issues).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
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

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "0.875rem 1rem",
    border: `1.5px solid ${fieldErrors[field] ? "var(--color-crimson)" : "var(--color-border)"}`,
    backgroundColor: "var(--color-cream)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9rem",
    color: "var(--color-navy)",
    outline: "none",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-sans)",
    fontWeight: 800,
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--color-navy)",
    marginBottom: "0.5rem",
  };

  const errStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "0.68rem",
    color: "var(--color-crimson)",
    marginTop: "0.3rem",
  };

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "var(--color-cream)", padding: "clamp(2.5rem,5vw,4rem)", paddingBottom: "clamp(2.5rem,5vw,4rem)", border: "var(--border-thick)", boxShadow: "var(--shadow-md)" }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "1rem" }}>CULTRAVEN</h1>
          </Link>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-navy)" }}>Create Account</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)", marginTop: "0.5rem" }}>Join the movement and get 10% off your first order.</p>
        </div>

        <form onSubmit={handleRegister} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="reg-first" style={labelStyle}>First Name</label>
              <input id="reg-first" type="text" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} disabled={loading} style={inputStyle("firstName")} />
              {fieldErrors.firstName && <p style={errStyle}>{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="reg-last" style={labelStyle}>Last Name</label>
              <input id="reg-last" type="text" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} disabled={loading} style={inputStyle("lastName")} />
              {fieldErrors.lastName && <p style={errStyle}>{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
            <input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={update("email")} disabled={loading} style={inputStyle("email")} />
            {fieldErrors.email && <p style={errStyle}>{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="reg-password" style={labelStyle}>Password</label>
            <input id="reg-password" type="password" autoComplete="new-password" value={form.password} onChange={update("password")} disabled={loading} style={inputStyle("password")} />
            {fieldErrors.password
              ? <p style={errStyle}>{fieldErrors.password}</p>
              : <p style={{ ...errStyle, color: "var(--color-gray)" }}>Min 8 chars, uppercase, lowercase &amp; number</p>
            }
          </div>

          <div>
            <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
            <input id="reg-confirm" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update("confirmPassword")} disabled={loading} style={inputStyle("confirmPassword")} />
            {fieldErrors.confirmPassword && <p style={errStyle}>{fieldErrors.confirmPassword}</p>}
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.78rem", color: "var(--color-crimson)", fontWeight: 600, padding: "0.75rem 1rem", backgroundColor: "rgba(201,66,39,0.06)", border: "1px solid rgba(201,66,39,0.25)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "1rem", backgroundColor: loading ? "#9fa8c0" : "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background-color 0.2s" }}
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>

          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--color-gray)", textAlign: "center", lineHeight: 1.6 }}>
            By registering you agree to our{" "}
            <Link href="/pages/terms" style={{ color: "var(--color-navy)", textDecoration: "underline" }}>Terms</Link>{" "}and{" "}
            <Link href="/pages/privacy" style={{ color: "var(--color-navy)", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>
        </form>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)", textAlign: "center", marginTop: "2rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--color-navy)", fontWeight: 700, textDecoration: "underline" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
