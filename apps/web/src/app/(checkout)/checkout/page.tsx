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
import { validateCoupon } from "@/lib/promotion-service";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE } from "@/lib/constants";

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
  const { items: cartItems, couponCode } = useCartStore();

  // Redirect to cart page if nothing in cart
  useEffect(() => {
    if (cartItems.length === 0) {
      router.replace("/cart");
    }
  }, [cartItems, router]);

  const subtotal = cartItems.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const promo = validateCoupon(couponCode, subtotal);
  const discount = promo.isValid ? promo.discountPaise : 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const total = subtotal - discount + shipping + codFee;

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
            slug: item.slug,
            quantity: item.quantity,
            size: item.size || "Free Size",
            color: item.color || "Default",
          })),
          address: {
            line1: form.address,
            line2: "",
            city: form.city,
            state: form.state,
            pincode: form.pincode
          },
          userId: "guest", // Could fetch from session if logged in
          paymentMethod,
          couponCode: couponCode || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Order creation failed");
      }

      const data = await res.json();

      if (paymentMethod === "cod") {
        router.push(`/order-success?orderId=${data.orderId}`);
        return;
      }

      const { orderId, amount, currency, keyId } = data;

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
        theme: { color: "var(--color-navy)" },
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
    border: `1.5px solid ${hasErr ? "var(--color-crimson)" : "var(--color-border)"}`,
    backgroundColor: "var(--color-cream)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9rem",
    color: "var(--color-navy)",
    outline: "none",
  });

  const LABEL: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-sans)",
    fontWeight: 800,
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--color-navy)",
    marginBottom: "0.5rem",
  };

  const ERR: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "0.72rem",
    color: "var(--color-crimson)",
    marginTop: "0.35rem",
  };

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Minimal header */}
      <header style={{ backgroundColor: "var(--color-navy)", padding: "1.25rem clamp(1.25rem,4vw,5rem)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.2em", color: "var(--color-cream)", textTransform: "uppercase" }}>
          CULTRAVEN
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)" }}>
          SECURE CHECKOUT
        </span>
      </header>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 400px", minHeight: "calc(100dvh - 68px)" }}
        className="checkout-layout"
      >
        {/* ── Left: Form ── */}
        <div style={{ padding: "clamp(2rem,5vw,5rem)" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "2.5rem" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: step === 1 ? 800 : 500, color: step === 1 ? "var(--color-navy)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Shipping
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: step === 2 ? 800 : 500, color: step === 2 ? "var(--color-navy)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Payment
            </span>
          </div>

          {/* STEP 1: Shipping */}
          {step === 1 && (
            <form onSubmit={handleStep1} noValidate>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 600, color: "var(--color-navy)", marginBottom: "2rem" }}>
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
                    backgroundColor: "var(--color-navy)",
                    color: "var(--color-cream)",
                    fontFamily: "var(--font-sans)",
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
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 600, color: "var(--color-navy)", marginBottom: "2rem" }}>
                Payment
              </h1>

              {/* Address summary */}
              <div style={{ border: "2px solid var(--color-navy)", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)", marginBottom: "2rem" }}>
                {[
                  { label: "Contact", value: form.email },
                  { label: "Ship to", value: `${form.address}, ${form.city}, ${form.state} ${form.pincode}` },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1.25rem", backgroundColor: "var(--color-mist)", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--color-gray)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{row.label}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-navy)" }}>{row.value}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-crimson)", background: "none", border: "none", cursor: "pointer" }}>
                      Change
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment method */}
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.875rem" }}>
                Payment Method
              </h2>
              <div style={{ border: "2px solid var(--color-navy)", boxShadow: "inset 2px 2px 0px 0px rgba(23,37,69,0.1)", backgroundColor: "var(--color-cream)", marginBottom: "2rem" }}>
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
                      borderBottom: idx < arr.length - 1 ? "1px solid var(--color-border)" : "none",
                      cursor: "pointer",
                      backgroundColor: paymentMethod === method.id ? "var(--color-mist)" : "transparent",
                    }}
                  >
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => setPaymentMethod(e.target.value)} style={{ accentColor: "var(--color-navy)", width: "16px", height: "16px", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)" }}>{method.label}</p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--color-gray)", marginTop: "2px" }}>{method.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentError && (
                <p role="alert" style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-crimson)", marginBottom: "1rem", padding: "0.75rem", backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                  {paymentError}
                </p>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setPaymentError(""); }}
                  style={{ width: "30%", padding: "1.1rem", backgroundColor: "transparent", color: "var(--color-navy)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", border: "2px solid var(--color-border)", cursor: "pointer" }}
                >
                  BACK
                </button>
                <button
                  id="checkout-place-order-btn"
                  type="submit"
                  disabled={loading}
                  style={{ width: "70%", padding: "1.1rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? "PROCESSING..." : `PAY ${fmt(total)}`}
                </button>
              </div>

              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "#9CA3AF", textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
                🔒 Secured by Razorpay · 256-bit SSL Encryption
              </p>
            </form>
          )}
        </div>

        {/* ── Right: Order summary ── */}
        <div style={{ backgroundColor: "var(--color-mist)", padding: "clamp(2rem,5vw,3.5rem)", borderLeft: "1px solid var(--color-border)" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "1.75rem" }}>
            ORDER SUMMARY
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
            {cartItems.map((item) => (
              <div key={item.sku} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative", width: "64px", aspectRatio: "3/4", backgroundColor: "var(--color-border)", flexShrink: 0 }}>
                  <Image src={item.image} alt={item.title} fill sizes="64px" style={{ objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700 }}>
                    {item.quantity}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", color: "var(--color-navy)", textTransform: "uppercase", marginBottom: "3px", lineHeight: 1.3 }}>{item.title}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--color-gray)" }}>Size: {item.size}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)", marginTop: "4px" }}>{fmt(item.pricePaise)}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)" }}>Subtotal</span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)" }}>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-crimson)" }}>Discount ({couponCode})</span>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-crimson)" }}>−{fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)" }}>Shipping</span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: shipping === 0 ? "#059669" : "var(--color-navy)" }}>{shipping === 0 ? "FREE" : fmt(shipping)}</span>
            </div>
            {codFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-gray)" }}>COD Fee</span>
                <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)" }}>{fmt(codFee)}</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-navy)" }}>TOTAL</span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "2rem", color: "var(--color-navy)" }}>{fmt(total)}</span>
          </div>

          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "#9CA3AF", marginTop: "0.5rem", textAlign: "right" }}>Inclusive of all taxes</p>
        </div>
      </div>

    </div>
  );
}
