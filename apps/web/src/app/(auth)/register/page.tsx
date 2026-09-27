"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/account");
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "#FFFFFF", padding: "clamp(2.5rem,5vw,4rem)", border: "1px solid #D9D3C4" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", color: "#172545", textTransform: "uppercase", marginBottom: "1rem" }}>CULTRAVEN</h1>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "2rem", color: "#172545" }}>Create Account</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>Join the movement and get 10% off your first order.</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>First Name</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Last Name</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Email Address</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1, marginTop: "0.5rem" }}>
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "2rem", borderTop: "1px solid #D9D3C4", paddingTop: "2rem" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280" }}>
            Already have an account? <Link href="/login" style={{ fontWeight: 700, color: "#172545", textDecoration: "underline" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
