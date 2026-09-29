"use client";
/**
 * Admin Login — /admin-login
 * Wrapped in Suspense to allow useSearchParams in production builds.
 */
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(redirect);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0F1419",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#1A2332",
          border: "1px solid rgba(245,241,232,0.1)",
          padding: "3rem 2.5rem",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.25em", color: "#F5F1E8", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            CULTRAVEN
          </p>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", color: "rgba(245,241,232,0.45)", textTransform: "uppercase" }}>
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              htmlFor="admin-password"
              style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,241,232,0.6)", marginBottom: "0.5rem" }}
            >
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter admin password"
              style={{ width: "100%", padding: "0.875rem 1rem", backgroundColor: "#0F1419", border: "1.5px solid rgba(245,241,232,0.15)", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.78rem", color: "#C94227", fontWeight: 600, padding: "0.75rem 1rem", backgroundColor: "rgba(201,66,39,0.1)", border: "1px solid rgba(201,66,39,0.3)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "1rem", backgroundColor: loading ? "#3a4a6b" : "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "AUTHENTICATING..." : "ACCESS ADMIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#0F1419", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(245,241,232,0.4)", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em" }}>LOADING…</div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
