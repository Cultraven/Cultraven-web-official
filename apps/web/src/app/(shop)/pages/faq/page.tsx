"use client";
import React, { useState } from "react";
import type { Metadata } from "next";

const FAQS = [
  { q: "How do I know which size to order?", a: "CULTRAVEN garments are cut in an OVERSIZED silhouette. We recommend sizing down if you prefer a standard oversized fit, or staying true to size for an extreme drop-shoulder look. Check our Size Guide for detailed measurements." },
  { q: "What is the fabric quality?", a: "We use 260 GSM pre-shrunk combed ring-spun cotton. Our garments are garment-washed for a soft hand feel and pre-shrunk to ensure minimal shrinkage after washing." },
  { q: "How long does delivery take?", a: "Standard delivery: 4–6 business days. Express delivery: 2–3 business days. We ship across India. Free shipping on orders above ₹1,999." },
  { q: "Can I return or exchange my order?", a: "Yes. Returns are accepted within 7 days of delivery and exchanges within 15 days. Items must be unworn, unwashed and with original tags. Initiate from your account dashboard." },
  { q: "Do you offer Cash on Delivery?", a: "Yes, COD is available on orders up to ₹5,000 on select pincodes. A ₹49 handling charge applies. Check availability at checkout by entering your pincode." },
  { q: "How do I track my order?", a: "Once dispatched, you'll receive a tracking link via SMS and email. You can also track from your account under 'Orders'." },
  { q: "How do I wash my CULTRAVEN garment?", a: "Cold machine wash (max 30°C), inside out. Do not bleach. Do not tumble dry. Iron on low heat, inside out. Following these instructions ensures your garment lasts longer and maintains its wash finish." },
  { q: "Are there any discount codes available?", a: "We occasionally run exclusive drops and discount codes for newsletter subscribers and loyal customers. Subscribe to our newsletter and follow @cultraven on Instagram for first access." },
  { q: "Do you ship internationally?", a: "We currently ship within India only. International shipping is on the roadmap. Subscribe to our newsletter to be the first to know." },
  { q: "How do I apply a discount code?", a: "Enter your discount code at checkout in the 'Coupon Code' field. The discount is applied automatically before payment." },
  { q: "What payment methods do you accept?", a: "We accept UPI, all major debit/credit cards, net banking, digital wallets (PhonePe, Google Pay, Paytm) and Cash on Delivery." },
  { q: "My order hasn't arrived. What do I do?", a: "If your order is beyond the estimated delivery date, first check your tracking link. If the package appears stuck, contact us at support@cultraven.com with your order number." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      <div style={{ backgroundColor: "#172545", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.75rem" }}>HELP CENTER</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 1 }}>Frequently Asked Questions</h1>
      </div>

      <div style={{ padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)", maxWidth: "760px" }}>
        <div style={{ borderTop: "1px solid #D9D3C4" }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #D9D3C4" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "1.5rem 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1rem" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#172545", lineHeight: 1.4 }}>{faq.q}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#172545" strokeWidth="2.5" style={{ flexShrink: 0, transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {open === i && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", lineHeight: 1.8, color: "#4B5563", paddingBottom: "1.5rem" }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem", backgroundColor: "#172545", padding: "2.5rem" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.75rem", color: "#F5F1E8", marginBottom: "0.75rem" }}>Still have a question?</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "rgba(245,241,232,0.65)", marginBottom: "1.5rem" }}>Our team is here to help. Drop us a message and we'll get back within 24 hours.</p>
          <a href="/contact" style={{ display: "inline-block", padding: "0.875rem 2rem", border: "2px solid #F5F1E8", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>CONTACT US</a>
        </div>
      </div>
    </div>
  );
}
