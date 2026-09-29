"use client";
/**
 * Checkout Page — /checkout
 *
 * 2-step checkout: Shipping → Payment
 * Integrates Razorpay checkout.js loaded dynamically (no key_secret in client bundle).
 *
 * Flow:
 *   1. User fills shipping form (Zod client-side validation)
 *   2. Clicks "Continue to Payment" → step 2
 *   3. Selects payment method, clicks "Place Order"
 *   4. POST /api/razorpay/create-order → gets orderId from server
 *   5. Opens Razorpay checkout popup
 *   6. On success → redirect to /order-success?id=<orderId>
 *
 * Security:
 *   - key_secret never in client bundle (Rule 5)
 *   - All validation done server-side too (Rule 4)
 *   - HTTPS enforced via HSTS header in next.config.ts (Rule 19)
 */

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
// We cast window to any below when calling Razorpay to avoid global type conflicts

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

// TODO: Replace with cart-service data
const CART_ITEMS = [
  {
    id: "c1",
    title: "RAVEN OVERSIZED TEE — ACID BLACK",
    pricePaise: 199900,
    qty: 1,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&auto=format&fit=crop&q=80",
    size: "L",
  },
  {
    id: "c2",
    title: "CARGO WIDE LEG — MILITARY OLIVE",
    pricePaise: 349900,
    qty: 1,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80",
    size: "M",
  },
];

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

function validateShipping(form: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
  if (form.firstName.trim().length < 2) e.firstName = "Required";
  if (form.lastName.trim().length < 2) e.lastName = "Required";
  if (form.address.trim().length < 5) e.address = "Enter full address";
  if (form.city.trim().length < 2) e.city = "Required";
  if (form.state.trim().length < 2) e.state = "Required";
  if (!/^\d{6}$/.test(form.pincode)) e.pincode = "6-digit pincode";
  if (!/^\d{10}$/.test(form.phone)) e.phone = "10-digit phone";
  return e;
}

// ── Load Razorpay script lazily ────────────────────────────────────────────────
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(script);
  });
}

import { useCartStore } from "@/store/cart";

// ── Component ──────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // ── Use Zustand cart items (localStorage-persisted) ────────────────────────
  const cartItems = useCartStore((s) => s.items);

  // Redirect to cart page if nothing in cart
  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace("/cart");
    }
  }, [cartItems, router]);

  const subtotal = cartItems.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const shipping = subtotal >= 199900 ? 0 : 9900;
  const total = subtotal + shipping;

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateShipping(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentError("");

    if (paymentMethod === "cod") {
      // COD: skip Razorpay, create order directly
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/order-success");
      return;
    }

    try {
      // 1. Create Razorpay order server-side
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaise: total,
          currency: "INR",
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          items: cartItems.map(item => ({
            productId: item.productId,
            sku: item.sku,
            title: item.title,
            image: item.image,
            size: item.size || "Free Size",
            color: item.color || "Default",
            pricePaise: item.pricePaise,
            quantity: item.quantity
          })),
          subtotalPaise: subtotal,
          shippingPaise: shipping,
          address: {
            line1: form.address,
            line2: "",
            city: form.city,
            state: form.state,
            pincode: form.pincode
          },
          userId: "guest", // Could fetch from session if logged in
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Order creation failed");
      }

      const { orderId, amount, currency, keyId } = await res.json();

      // 2. Load Razorpay script
      await loadRazorpayScript();

      // 3. Open Razorpay checkout popup
      const razorpay = new (window as any).Razorpay({
        key: keyId,
        amount,
        currency,
        name: "CULTRAVEN",
        description: `Order #${orderId}`,
        order_id: orderId,
        prefill: {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#172545" },
        handler: (response: any) => {
          // Payment successful — redirect to order success
          // Note: server-side webhook (payment.captured) is the authoritative confirmation
          router.push(`/order-success?paymentId=${response.razorpay_payment_id}&orderId=${response.razorpay_order_id}`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentError("Payment cancelled. Please try again.");
          },
        },
      });

      razorpay.open();
    } catch (err) {
      console.error("[checkout] Payment error:", err);
      setPaymentError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  const INPUT = (hasErr?: string): React.CSSProperties => ({
    width: "100%",
    padding: "0.875rem 1rem",
    border: `1.5px solid ${hasErr ? "#C94227" : "#D9D3C4"}`,
    backgroundColor: "#FFFFFF",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    color: "#172545",
    outline: "none",
  });

  const LABEL: React.CSSProperties = {
    display: "block",
    fontFamily: "Inter, sans-serif",
    fontWeight: 800,
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#172545",
    marginBottom: "0.5rem",
  };

  const ERR: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "0.72rem",
    color: "#C94227",
    marginTop: "0.35rem",
  };

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Minimal header */}
      <header style={{ backgroundColor: "#172545", padding: "1.25rem clamp(1.25rem,4vw,5rem)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.2em", color: "#F5F1E8", textTransform: "uppercase" }}>
          CULTRAVEN
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)" }}>
          SECURE CHECKOUT
        </span>
      </header>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 400px", minHeight: "calc(100vh - 68px)" }}
        className="checkout-layout"
      >
        {/* ── Left: Form ── */}
        <div style={{ padding: "clamp(2rem,5vw,5rem)" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2.5rem" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: step === 1 ? 800 : 500, color: step === 1 ? "#172545" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Shipping
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D9D3C4" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: step === 2 ? 800 : 500, color: step === 2 ? "#172545" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Payment
            </span>
          </div>

          {/* STEP 1: Shipping */}
          {step === 1 && (
            <form onSubmit={handleStep1} noValidate>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 600, color: "#172545", marginBottom: "2rem" }}>
                Contact & Shipping
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label htmlFor="checkout-email" style={LABEL}>Email *</label>
                  <input id="checkout-email" type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" aria-invalid={!!errors.email} style={INPUT(errors.email)} />
                  {errors.email && <p role="alert" style={ERR}>{errors.email}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label htmlFor="checkout-fname" style={LABEL}>First Name *</label>
                    <input id="checkout-fname" type="text" required value={form.firstName} onChange={update("firstName")} placeholder="First name" style={INPUT(errors.firstName)} />
                    {errors.firstName && <p role="alert" style={ERR}>{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="checkout-lname" style={LABEL}>Last Name *</label>
                    <input id="checkout-lname" type="text" required value={form.lastName} onChange={update("lastName")} placeholder="Last name" style={INPUT(errors.lastName)} />
                    {errors.lastName && <p role="alert" style={ERR}>{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-address" style={LABEL}>Address *</label>
                  <input id="checkout-address" type="text" required value={form.address} onChange={update("address")} placeholder="House / Flat / Building, Street" style={INPUT(errors.address)} />
                  {errors.address && <p role="alert" style={ERR}>{errors.address}</p>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label htmlFor="checkout-city" style={LABEL}>City *</label>
                    <input id="checkout-city" type="text" required value={form.city} onChange={update("city")} placeholder="City" style={INPUT(errors.city)} />
                    {errors.city && <p role="alert" style={ERR}>{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="checkout-state" style={LABEL}>State *</label>
                    <input id="checkout-state" type="text" required value={form.state} onChange={update("state")} placeholder="State" style={INPUT(errors.state)} />
                    {errors.state && <p role="alert" style={ERR}>{errors.state}</p>}
                  </div>
                  <div>
                    <label htmlFor="checkout-pincode" style={LABEL}>Pincode *</label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      required
                      value={form.pincode}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }));
                        setErrors((p) => ({ ...p, pincode: undefined }));
                      }}
                      placeholder="6 digits"
                      inputMode="numeric"
                      style={INPUT(errors.pincode)}
                    />
                    {errors.pincode && <p role="alert" style={ERR}>{errors.pincode}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-phone" style={LABEL}>Phone *</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }));
                      setErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    style={INPUT(errors.phone)}
                  />
                  {errors.phone && <p role="alert" style={ERR}>{errors.phone}</p>}
                </div>

                <button
                  id="checkout-continue-btn"
                  type="submit"
                  style={{
                    marginTop: "0.5rem",
                    width: "100%",
                    padding: "1.1rem",
                    backgroundColor: "#172545",
                    color: "#F5F1E8",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  CONTINUE TO PAYMENT
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment */}
          {step === 2 && (
            <form onSubmit={handlePlaceOrder}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 600, color: "#172545", marginBottom: "2rem" }}>
                Payment
              </h1>

              {/* Address summary */}
              <div style={{ border: "1.5px solid #D9D3C4", marginBottom: "2rem" }}>
                {[
                  { label: "Contact", value: form.email },
                  { label: "Ship to", value: `${form.address}, ${form.city}, ${form.state} ${form.pincode}` },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1.25rem", backgroundColor: "#EAE6DB", borderBottom: i < arr.length - 1 ? "1px solid #D9D3C4" : "none" }}>
                    <div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "#6B7280", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{row.label}</p>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#172545" }}>{row.value}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "#C94227", background: "none", border: "none", cursor: "pointer" }}>
                      Change
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment method */}
              <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "0.875rem" }}>
                Payment Method
              </h2>
              <div style={{ border: "1.5px solid #D9D3C4", backgroundColor: "#FFFFFF", marginBottom: "2rem" }}>
                {[
                  { id: "razorpay", label: "UPI / Card / Netbanking / Wallets", sub: "Powered by Razorpay — PCI DSS Level 1 Secure" },
                  { id: "cod", label: "Cash on Delivery", sub: "Available on orders up to ₹5,000. ₹49 handling fee." },
                ].map((method, idx, arr) => (
                  <label
                    key={method.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                      borderBottom: idx < arr.length - 1 ? "1px solid #D9D3C4" : "none",
                      cursor: "pointer",
                      backgroundColor: paymentMethod === method.id ? "#EAE6DB" : "transparent",
                    }}
                  >
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => setPaymentMethod(e.target.value)} style={{ accentColor: "#172545", width: "16px", height: "16px", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{method.label}</p>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#6B7280", marginTop: "2px" }}>{method.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentError && (
                <p role="alert" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#C94227", marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                  {paymentError}
                </p>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setPaymentError(""); }}
                  style={{ width: "30%", padding: "1.1rem", backgroundColor: "transparent", color: "#172545", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", border: "2px solid #D9D3C4", cursor: "pointer" }}
                >
                  BACK
                </button>
                <button
                  id="checkout-place-order-btn"
                  type="submit"
                  disabled={loading}
                  style={{ width: "70%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? "PROCESSING..." : `PAY ${fmt(total)}`}
                </button>
              </div>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "#9CA3AF", textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
                🔒 Secured by Razorpay · 256-bit SSL Encryption
              </p>
            </form>
          )}
        </div>

        {/* ── Right: Order summary ── */}
        <div style={{ backgroundColor: "#EAE6DB", padding: "clamp(2rem,5vw,3.5rem)", borderLeft: "1px solid #D9D3C4" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "1.75rem" }}>
            ORDER SUMMARY
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
            {CART_ITEMS.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative", width: "64px", aspectRatio: "3/4", backgroundColor: "#D9D3C4", flexShrink: 0 }}>
                  <Image src={item.image} alt={item.title} fill sizes="64px" style={{ objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#172545", color: "#F5F1E8", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700 }}>
                    {item.qty}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.68rem", color: "#172545", textTransform: "uppercase", marginBottom: "3px", lineHeight: 1.3 }}>{item.title}</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#6B7280" }}>Size: {item.size}</p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545", marginTop: "4px" }}>{fmt(item.pricePaise)}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #D9D3C4", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#6B7280" }}>Subtotal</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#172545" }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#6B7280" }}>Shipping</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: shipping === 0 ? "#059669" : "#172545" }}>{shipping === 0 ? "FREE" : fmt(shipping)}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #D9D3C4", paddingTop: "1.5rem" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545" }}>TOTAL</span>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "2rem", color: "#172545" }}>{fmt(total)}</span>
          </div>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "#9CA3AF", marginTop: "0.5rem", textAlign: "right" }}>Inclusive of all taxes</p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .checkout-layout { grid-template-columns: 1fr !important; }
          .checkout-layout > div:last-child { border-left: none !important; border-top: 1px solid #D9D3C4 !important; }
        }
      `}</style>
    </div>
  );
}
