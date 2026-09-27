"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/account");
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "440px", width: "100%", backgroundColor: "#FFFFFF", padding: "clamp(2.5rem,5vw,4rem)", border: "1px solid #D9D3C4" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", color: "#172545", textTransform: "uppercase", marginBottom: "1rem" }}>CULTRAVEN</h1>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2rem", color: "#172545" }}>Welcome Back</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>Log in to access your account and orders.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
              <label style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545" }}>Password</label>
              <Link href="#" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#6B7280", textDecoration: "underline" }}>Forgot?</Link>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1, marginTop: "0.5rem" }}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "2rem", borderTop: "1px solid #D9D3C4", paddingTop: "2rem" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280" }}>
            Don't have an account? <Link href="/register" style={{ fontWeight: 700, color: "#172545", textDecoration: "underline" }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
