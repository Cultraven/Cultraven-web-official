"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE } from "@/lib/constants";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry","Chandigarh"];

interface Address {
  name: string; line1: string; line2: string; city: string;
  state: string; pincode: string; phone: string; email: string;
}

const EMPTY_ADDRESS: Address = { name: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "", email: "" };

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "2px solid var(--color-navy)",
  backgroundColor: "white",
  fontFamily: "var(--font-sans)",
  fontSize: "0.85rem",
  color: "var(--color-navy)",
  outline: "none",
  boxSizing: "border-box",
};
const LABEL: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: "0.65rem",
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-navy)",
  marginBottom: "0.4rem",
};

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const router = useRouter();
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [payMethod, setPayMethod] = useState<"cod" | "razorpay">("cod");
  const [errors, setErrors] = useState<Partial<Address & {general: string}>>({});
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = payMethod === "cod" ? COD_FEE : 0;
  const total = subtotal + shipping + codFee;

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const e: Partial<Address & {general:string}> = {};
    if (!address.name.trim()) e.name = "Required";
    if (!address.line1.trim()) e.line1 = "Required";
    if (!address.city.trim()) e.city = "Required";
    if (!address.state) e.state = "Required";
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = "Must be 6 digits";
    if (!/^\d{10}$/.test(address.phone)) e.phone = "Must be 10 digits";
    if (!address.email.includes("@")) e.email = "Valid email required";
    return e;
  };

  const placeOrder = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            sku: i.sku,
            title: i.title,
            image: typeof i.image === "string" ? i.image : "",
            size: i.size,
            color: i.color,
            pricePaise: i.pricePaise,
            quantity: i.quantity,
          })),
          deliveryAddress: {
            name: address.name,
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            phone: address.phone,
          },
          email: address.email,
          paymentMethod: payMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      clearCart();
      router.push(`/checkout/success?order=${data.orderNumber}&total=${data.totalPaise}`);
    } catch (err: any) {
      setErrors({ general: err.message || "Something went wrong. Please try again." });
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: "var(--color-cream)", minHeight: "80dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 400, color: "var(--color-navy)", marginBottom: "1rem" }}>YOUR BAG IS EMPTY</h1>
        <Link href="/collections/all" style={{ display: "inline-block", padding: "1rem 2.5rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", border: "2px solid var(--color-navy)", boxShadow: "4px 4px 0px var(--color-lava)" }}>
          SHOP NOW
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", paddingBottom: "6rem" }}>
      {/* Breadcrumb */}
      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "2rem", paddingBottom: "1rem", borderBottom: "1px solid var(--color-line)" }}>
        <nav style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {[{ label: "Bag", href: "/" }, { label: "Details", href: "#" }, { label: "Confirmation", href: "#" }].map((c, i) => (
            <React.Fragment key={c.label}>
              {c.href !== "#" ? <Link href={c.href} style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)", textDecoration: "none" }}>{c.label}</Link> : <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: i === 1 ? "var(--color-navy)" : "var(--color-gray)" }}>{c.label}</span>}
              {i < 2 && <span style={{ color: "var(--color-border)", fontSize: "10px" }}>›</span>}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div style={{ paddingInline: "clamp(1rem,4vw,5rem)", paddingTop: "2.5rem", display: "grid", gridTemplateColumns: "1fr 400px", gap: "4rem", alignItems: "start" }} className="checkout-grid">
        {/* ── LEFT: Form ── */}
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem,3vw,2.5rem)", fontWeight: 400, color: "var(--color-navy)", marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.02em" }}>Delivery Details</h1>

          {errors.general && (
            <div style={{ padding: "1rem", backgroundColor: "rgba(201,66,39,0.08)", border: "2px solid var(--color-crimson)", marginBottom: "1.5rem", fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-crimson)", fontWeight: 700 }}>
              {errors.general}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Name */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Full Name *</label>
              <input value={address.name} onChange={set("name")} placeholder="Arjun Mehta" style={{ ...INPUT, borderColor: errors.name ? "var(--color-crimson)" : "var(--color-navy)" }} />
              {errors.name && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Email Address *</label>
              <input type="email" value={address.email} onChange={set("email")} placeholder="you@example.com" style={{ ...INPUT, borderColor: errors.email ? "var(--color-crimson)" : "var(--color-navy)" }} />
              {errors.email && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.email}</p>}
            </div>

            {/* Phone */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Phone Number * (10 digits)</label>
              <input type="tel" value={address.phone} onChange={set("phone")} placeholder="9876543210" maxLength={10} style={{ ...INPUT, borderColor: errors.phone ? "var(--color-crimson)" : "var(--color-navy)" }} />
              {errors.phone && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.phone}</p>}
            </div>

            {/* Address Line 1 */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Address Line 1 *</label>
              <input value={address.line1} onChange={set("line1")} placeholder="House/Flat No., Street Name" style={{ ...INPUT, borderColor: errors.line1 ? "var(--color-crimson)" : "var(--color-navy)" }} />
              {errors.line1 && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.line1}</p>}
            </div>

            {/* Address Line 2 */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>Address Line 2 (Optional)</label>
              <input value={address.line2} onChange={set("line2")} placeholder="Apartment, Landmark, Area" style={INPUT} />
            </div>

            {/* City */}
            <div>
              <label style={LABEL}>City *</label>
              <input value={address.city} onChange={set("city")} placeholder="Mumbai" style={{ ...INPUT, borderColor: errors.city ? "var(--color-crimson)" : "var(--color-navy)" }} />
              {errors.city && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.city}</p>}
            </div>

            {/* Pincode */}
            <div>
              <label style={LABEL}>Pincode *</label>
              <input value={address.pincode} onChange={set("pincode")} placeholder="400001" maxLength={6} style={{ ...INPUT, borderColor: errors.pincode ? "var(--color-crimson)" : "var(--color-navy)" }} />
              {errors.pincode && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.pincode}</p>}
            </div>

            {/* State */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={LABEL}>State *</label>
              <select value={address.state} onChange={set("state")} style={{ ...INPUT, cursor: "pointer", appearance: "none", borderColor: errors.state ? "var(--color-crimson)" : "var(--color-navy)" }}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--color-crimson)", marginTop: "4px" }}>{errors.state}</p>}
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ marginTop: "2.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, color: "var(--color-navy)", marginBottom: "1.25rem", textTransform: "uppercase" }}>Payment Method</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { id: "cod", label: "Cash on Delivery", desc: `₹49 COD handling fee applies`, icon: "💵" },
                { id: "razorpay", label: "UPI / Card / Net Banking", desc: "Razorpay — Secure Online Payment", icon: "💳" },
              ].map(({ id, label, desc, icon }) => (
                <label key={id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", border: `2px solid ${payMethod === id ? "var(--color-navy)" : "var(--color-line)"}`, backgroundColor: payMethod === id ? "rgba(23,37,84,0.04)" : "white", cursor: "pointer", boxShadow: payMethod === id ? "3px 3px 0px var(--color-navy)" : "none", transition: "all 0.15s ease" }}>
                  <input type="radio" name="payment" value={id} checked={payMethod === id} onChange={() => setPayMethod(id as "cod" | "razorpay")} style={{ accentColor: "var(--color-navy)", width: "18px", height: "18px" }} />
                  <span style={{ fontSize: "1.25rem" }}>{icon}</span>
                  <div>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.85rem", color: "var(--color-navy)", marginBottom: "2px" }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--color-gray)" }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={placeOrder}
            disabled={placing}
            style={{ marginTop: "2.5rem", width: "100%", padding: "1.25rem", backgroundColor: placing ? "rgba(23,37,84,0.5)" : "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "2px solid var(--color-navy)", cursor: placing ? "not-allowed" : "pointer", boxShadow: placing ? "none" : "5px 5px 0px 0px var(--color-lava)", transition: "all 0.15s ease" }}
          >
            {placing ? "PLACING ORDER..." : `PLACE ORDER — ${fmt(total)}`}
          </button>

          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--color-gray)", textAlign: "center", marginTop: "1rem" }}>
            By placing your order you agree to our Terms & Privacy Policy.
          </p>
        </div>

        {/* ── RIGHT: Order Summary ── */}
        <div style={{ backgroundColor: "white", border: "2px solid var(--color-navy)", padding: "1.75rem", boxShadow: "6px 6px 0px var(--color-navy)", position: "sticky", top: "140px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 400, color: "var(--color-navy)", marginBottom: "1.5rem", textTransform: "uppercase" }}>Order Summary</h2>

          {/* Items */}
          <div style={{ marginBottom: "1.5rem" }}>
            {items.map((item) => (
              <div key={item.sku} style={{ display: "flex", gap: "0.875rem", padding: "0.875rem 0", borderBottom: "1px solid var(--color-line)" }}>
                <div style={{ position: "relative", width: "64px", height: "80px", flexShrink: 0, border: "1px solid var(--color-line)", backgroundColor: "var(--color-mist)" }}>
                  <Image src={typeof item.image === "string" ? item.image : ""} alt={item.title} fill sizes="64px" style={{ objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: "-8px", right: "-8px", width: "20px", height: "20px", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", borderRadius: "50%", fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.quantity}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", color: "var(--color-navy)", letterSpacing: "0.02em", lineHeight: 1.3, marginBottom: "4px" }}>{item.title}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--color-gray)" }}>Size: {item.size} · {item.color}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.85rem", color: "var(--color-navy)", marginTop: "4px" }}>{fmt(item.pricePaise * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          {[
            { label: "Subtotal", val: fmt(subtotal) },
            { label: "Shipping", val: shipping === 0 ? "FREE" : fmt(shipping) },
            ...(codFee > 0 ? [{ label: "COD Fee", val: fmt(codFee) }] : []),
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "var(--color-navy)" }}>
              <span>{label}</span>
              <span style={{ fontWeight: 700, color: val === "FREE" ? "#10B981" : undefined }}>{val}</span>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "2px solid var(--color-navy)" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.9rem", color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.08em" }}>TOTAL</span>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "1.5rem", color: "var(--color-navy)" }}>{fmt(total)}</span>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {["🔒 SSL Secure", "🚚 Fast Delivery", "↩ 7-Day Returns"].map((b) => (
              <span key={b} style={{ fontFamily: "var(--font-sans)", fontSize: "0.65rem", fontWeight: 700, color: "var(--color-gray)", letterSpacing: "0.06em" }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
