import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Information | CULTRAVEN",
  description: "CULTRAVEN shipping policy — delivery timelines, free shipping threshold, express delivery and tracking.",
};

const INFO_SECTIONS = [
  {
    heading: "Free Shipping",
    body: "Enjoy free standard shipping on all orders above ₹1,999. Orders below ₹1,999 incur a flat shipping fee of ₹99.",
  },
  {
    heading: "Delivery Timelines",
    body: "Standard Delivery: 4–6 business days.\nExpress Delivery: 2–3 business days (₹199 additional).\nSame-day delivery available in Delhi NCR, Mumbai and Bengaluru for orders placed before 12 PM.",
  },
  {
    heading: "Order Processing",
    body: "All orders are processed within 24–48 hours on business days (Monday–Saturday). Orders placed on Sundays or public holidays are processed the next business day.",
  },
  {
    heading: "Order Tracking",
    body: "Once your order is dispatched, you will receive a tracking link via SMS and email. You can also track your order from your account dashboard under 'Orders'.",
  },
  {
    heading: "Cash on Delivery (COD)",
    body: "COD is available on orders up to ₹5,000 in select pincodes. A COD handling charge of ₹49 applies. Check pincode availability at checkout.",
  },
  {
    heading: "International Shipping",
    body: "We currently ship across India only. International shipping is coming soon. Join our newsletter to be notified when we go global.",
  },
];

export default function ShippingPage() {
  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.75rem" }}>WE GOT YOU</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "var(--color-cream)", lineHeight: 1 }}>Shipping</h1>
      </div>

      {/* Shipping highlights */}
      <div style={{ backgroundColor: "var(--color-mist)", padding: "2.5rem clamp(1.25rem,4vw,5rem)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem" }} className="ship-grid">
          {[{ icon: "🚚", label: "Free Shipping", sub: "On orders above ₹1,999" }, { icon: "⚡", label: "Express Available", sub: "2–3 business days" }, { icon: "📦", label: "Fast Processing", sub: "Within 24–48 hours" }, { icon: "📍", label: "Track Your Order", sub: "Real-time updates" }].map((item) => (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1.5rem" }}>
              <span style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{item.icon}</span>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.25rem" }}>{item.label}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--color-gray)" }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)", maxWidth: "760px" }}>
        {INFO_SECTIONS.map((sec, i) => (
          <div key={i} style={{ paddingBottom: "2.5rem", marginBottom: "2.5rem", borderBottom: i < INFO_SECTIONS.length - 1 ? "1px solid var(--color-border)" : "none" }}>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.875rem" }}>{sec.heading}</h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", lineHeight: 1.8, color: "#4B5563", whiteSpace: "pre-line" }}>{sec.body}</p>
          </div>
        ))}
        <div style={{ backgroundColor: "var(--color-navy)", padding: "2rem" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.78rem", color: "var(--color-cream)", marginBottom: "0.5rem" }}>Still have questions?</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "rgba(245,241,232,0.7)", marginBottom: "1rem" }}>Our team is available Monday–Saturday, 10 AM – 6 PM IST.</p>
          <a href="/contact" style={{ display: "inline-block", padding: "0.75rem 1.75rem", border: "2px solid var(--color-cream)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>CONTACT US</a>
        </div>
      </div>
    </div>
  );
}
