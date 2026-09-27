"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const CART_ITEMS = [
  { id: "c1", title: "RAVEN OVERSIZED TEE — ACID BLACK", pricePaise: 199900, qty: 1, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80", size: "L" },
  { id: "c2", title: "CARGO WIDE LEG — MILITARY OLIVE", pricePaise: 349900, qty: 1, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80", size: "M" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // 1: Shipping, 2: Payment
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "rohan.sharma@example.com",
    firstName: "Rohan",
    lastName: "Sharma",
    address: "A-14, Hauz Khas Enclave",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110016",
    phone: "9876543210",
  });
  
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const subtotal = CART_ITEMS.reduce((s, i) => s + i.pricePaise * i.qty, 0);
  const shipping = subtotal >= 199900 ? 0 : 9900;
  const total = subtotal + shipping;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/order-success");
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Minimal Header for Checkout */}
      <header style={{ backgroundColor: "#172545", padding: "1.5rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.2em", color: "#F5F1E8", textTransform: "uppercase", margin: 0 }}>CULTRAVEN</h1>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", minHeight: "calc(100vh - 72px)" }} className="checkout-layout">
        
        {/* Left: Form */}
        <div style={{ padding: "clamp(2rem,5vw,5rem)" }}>
          {/* Breadcrumbs */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: step === 1 ? 800 : 500, color: step === 1 ? "#172545" : "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>Shipping</span>
            <span style={{ color: "#D9D3C4" }}>›</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: step === 2 ? 800 : 500, color: step === 2 ? "#172545" : "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>Payment</span>
          </div>

          <form onSubmit={handleContinue}>
            {step === 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#172545", marginBottom: "0.5rem" }}>Contact & Shipping</h2>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>First Name</label>
                    <input type="text" required value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Last Name</label>
                    <input type="text" required value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Address</label>
                  <input type="text" required value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>City</label>
                    <input type="text" required value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>State</label>
                    <input type="text" required value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Pincode</label>
                    <input type="text" required value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Phone</label>
                  <input type="tel" required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "#172545", outline: "none" }} />
                </div>
                <button type="submit" style={{ marginTop: "1rem", width: "100%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>CONTINUE TO PAYMENT</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "2rem", color: "#172545", marginBottom: "0.5rem" }}>Payment</h2>
                <div style={{ backgroundColor: "#EAE6DB", border: "1px solid #D9D3C4", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280", marginBottom: "0.25rem" }}>Contact</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#172545" }}>{form.email}</p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#C94227", background: "none", border: "none", cursor: "pointer" }}>Change</button>
                </div>
                <div style={{ backgroundColor: "#EAE6DB", border: "1px solid #D9D3C4", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", borderTop: "none" }}>
                  <div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280", marginBottom: "0.25rem" }}>Ship to</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#172545" }}>{form.address}, {form.city}, {form.state} {form.pincode}</p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#C94227", background: "none", border: "none", cursor: "pointer" }}>Change</button>
                </div>
                
                <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginTop: "1rem", marginBottom: "0.5rem" }}>Payment Method</h3>
                <div style={{ border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF" }}>
                  {[
                    { id: "upi", label: "UPI (Google Pay, PhonePe, Paytm)" },
                    { id: "card", label: "Credit / Debit Card" },
                    { id: "cod", label: "Cash on Delivery" },
                  ].map((method, idx, arr) => (
                    <label key={method.id} style={{ display: "flex", alignItems: "center", padding: "1rem 1.25rem", borderBottom: idx !== arr.length - 1 ? "1px solid #D9D3C4" : "none", cursor: "pointer", backgroundColor: paymentMethod === method.id ? "#EAE6DB" : "transparent" }}>
                      <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => setPaymentMethod(e.target.value)} style={{ accentColor: "#172545", width: "16px", height: "16px", marginRight: "1rem" }} />
                      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{method.label}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setStep(1)} style={{ width: "30%", padding: "1.1rem", backgroundColor: "transparent", color: "#172545", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "2px solid #D9D3C4", cursor: "pointer" }}>BACK</button>
                  <button type="submit" disabled={loading} style={{ width: "70%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1 }}>
                    {loading ? "PROCESSING..." : "PLACE ORDER"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right: Order Summary */}
        <div style={{ backgroundColor: "#EAE6DB", padding: "clamp(2rem,5vw,3rem)", borderLeft: "1px solid #D9D3C4" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "1.5rem" }}>ORDER SUMMARY</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            {CART_ITEMS.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative", width: "64px", aspectRatio: "3/4", backgroundColor: "#D9D3C4", flexShrink: 0 }}>
                  <Image src={item.image} alt={item.title} fill sizes="64px" style={{ objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#172545", color: "#F5F1E8", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700 }}>{item.qty}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", color: "#172545", textTransform: "uppercase", marginBottom: "0.25rem", lineHeight: 1.3 }}>{item.title}</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6B7280", marginBottom: "0.25rem" }}>Size: {item.size}</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{fmt(item.pricePaise)}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #D9D3C4", paddingTop: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #D9D3C4", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280" }}>Subtotal</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#172545" }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6B7280" }}>Shipping</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#172545" }}>{shipping === 0 ? "FREE" : fmt(shipping)}</span>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545" }}>TOTAL</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "1.75rem", color: "#172545" }}>{fmt(total)}</span>
          </div>
        </div>

      </div>
      <style>{`
        @media (max-width: 900px) { .checkout-layout { grid-template-columns: 1fr !important; } .checkout-layout > div:last-child { border-left: none; border-top: 1px solid #D9D3C4; } }
      `}</style>
    </div>
  );
}
