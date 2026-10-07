"use client";
import { BrandLogo } from "@/components/common/BrandLogo";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/components/admin/admin.css";
import { Button, Field } from "@/components/admin/ui";

export default function DeliveryLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delivery-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/portal-delivery"); return; }
      setError(data.error || "Invalid credentials.");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="adm">
      <div className="adm-login">
        <div className="adm-login-art">
          <BrandLogo height={34} tone="light" />
          <div>
            <h2>Delivery Portal</h2>
            <p>View assigned orders and update delivery status on the go.</p>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Staff access only</div>
        </div>
        <div className="adm-login-form">
          <div className="adm-login-card">
            <form className="adm-card adm-card-pad" onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 20 }}>Delivery sign in</h1>
                <p style={{ color: "var(--a-muted)", fontSize: 13.5, marginTop: 2 }}>Enter your delivery staff credentials.</p>
              </div>
              {error ? (
                <div role="alert" className="adm-alert adm-alert-error" style={{ marginBottom: 0 }}><div>{error}</div></div>
              ) : null}
              <Field label="Email" required>
                <input className="adm-input" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Field label="Password" required>
                <div style={{ position: "relative" }}>
                  <input className="adm-input" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 56 }} />
                  <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"} style={{ position: "absolute", right: 4, top: 4 }}>{show ? "Hide" : "Show"}</button>
                </div>
              </Field>
              <Button type="submit" variant="primary" loading={loading} style={{ width: "100%", height: 40 }}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <Link href="/portal-access" style={{ fontSize: 13, color: "var(--a-text, inherit)", textAlign: "center", fontWeight: 600 }}>
                Store admin? Sign in here →
              </Link>
              <Link href="/" style={{ fontSize: 13, color: "var(--a-muted)", textAlign: "center" }}>
                ← Back to website
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
