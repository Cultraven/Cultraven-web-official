"use client";
/**
 * Admin Login. Wrapped in Suspense to allow useSearchParams in production builds.
 * Lives outside the admin shell, so it imports the admin styles itself.
 */
import { BrandLogo } from "@/components/common/BrandLogo";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "@/components/admin/admin.css";
import { Button, Field } from "@/components/admin/ui";
import { safeRedirect } from "@/lib/safe-redirect";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"), "/portal-secure", "/portal-secure");

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
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(redirect);
        return;
      }
      setError(data.error || "Login failed. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <form className="adm-card adm-card-pad" onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20 }}>Sign in</h1>
        <p style={{ color: "var(--a-muted)", fontSize: 13.5, marginTop: 2 }}>Enter your admin credentials to continue.</p>
      </div>

      {error ? (
        <div role="alert" className="adm-alert adm-alert-error" style={{ marginBottom: 0 }}>
          <div>{error}</div>
        </div>
      ) : null}

      <Field label="Email" required>
        <input
          className="adm-input"
          type="email"
          name="email"
          autoComplete="username"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" required>
        <div style={{ position: "relative" }}>
          <input
            className="adm-input"
            type={show ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            style={{ paddingRight: 56 }}
          />
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            style={{ position: "absolute", right: 4, top: 4 }}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      <Button type="submit" variant="primary" loading={loading} style={{ width: "100%", height: 40 }}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <Link href="/portal-delivery-access" style={{ fontSize: 13, color: "var(--a-text, inherit)", textAlign: "center", fontWeight: 600 }}>
        Delivery partner? Sign in here →
      </Link>
      <Link href="/" style={{ fontSize: 13, color: "var(--a-muted)", textAlign: "center" }}>
        ← Back to website
      </Link>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="adm">
      <div className="adm-login">
        <div className="adm-login-art">
          <BrandLogo height={34} tone="light" />
          <div>
            <h2>Run the store. Shape the site.</h2>
            <p>Manage products, orders and every piece of website content from one place.</p>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Admin console</div>
        </div>
        <div className="adm-login-form">
          <div className="adm-login-card">
            <Suspense fallback={<div className="adm-card adm-card-pad" style={{ height: 320 }} />}>
              <AdminLoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
