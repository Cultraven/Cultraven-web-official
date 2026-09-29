"use client";
/**
 * FAQ Page — /pages/faq
 * Accordion-based FAQ matching brand voice and covering all key topics.
 */
import React, { useState } from "react";

const FAQS = [
  {
    category: "ORDERS",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order is dispatched, you'll receive a tracking link via SMS and email. You can also track your order anytime from your account dashboard under 'My Orders'.",
      },
      {
        q: "Can I cancel my order after placing it?",
        a: "Orders can be cancelled within 30 minutes of placing. After that, please wait for delivery and initiate a return. Contact our support team immediately if you need to cancel — we'll do our best to help.",
      },
      {
        q: "I placed an order but didn't receive a confirmation email. What should I do?",
        a: "Please check your spam/junk folder first. If it's not there, contact us at support@cultraven.com or via WhatsApp with your phone number and order details.",
      },
      {
        q: "Can I modify my order after placing it?",
        a: "We can modify orders (size, colour, address) within 30 minutes of placing. Contact us immediately via WhatsApp for the fastest response.",
      },
    ],
  },
  {
    category: "SIZING",
    items: [
      {
        q: "How should I size for CULTRAVEN products?",
        a: "All CULTRAVEN tees are OVERSIZED FIT. We recommend sizing down 1–2 sizes from your regular size. If you normally wear L, order M for a standard oversized look, or keep L for an extreme drop-shoulder silhouette.",
      },
      {
        q: "Do you have a size guide?",
        a: "Yes! Visit our Size Guide page for detailed measurements of chest width, body length, and shoulder width for each size across all product categories.",
      },
      {
        q: "What sizes do you offer?",
        a: "We offer sizes XS, S, M, L, XL, and XXL. Some limited-edition drops may have restricted size availability.",
      },
      {
        q: "Will the fabric shrink after washing?",
        a: "All our products are pre-shrunk, so minimal shrinkage is expected. Follow care instructions: cold wash, inside out, no tumble dry.",
      },
    ],
  },
  {
    category: "SHIPPING",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery: 4–6 business days. Express delivery (₹199 extra): 2–3 business days. Same-day delivery available in Delhi NCR, Mumbai and Bengaluru for orders placed before 12 PM.",
      },
      {
        q: "Is there free shipping?",
        a: "Yes! Free standard shipping on all orders above ₹1,999. Orders below ₹1,999 have a flat ₹99 shipping fee.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we ship within India only. International shipping is coming soon! Sign up for our newsletter to be notified.",
      },
      {
        q: "Is Cash on Delivery available?",
        a: "Yes, COD is available on orders up to ₹5,000 in select pincodes, with a ₹49 COD handling fee. Availability is shown at checkout based on your pincode.",
      },
    ],
  },
  {
    category: "RETURNS & EXCHANGES",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 7-day return window from the date of delivery. Items must be unworn, unwashed, with original tags attached. Sale items and custom orders are not eligible for returns.",
      },
      {
        q: "How do I initiate a return?",
        a: "Log in to your account → Go to 'My Orders' → Select the order → Click 'Return/Exchange'. Our team will arrange a pickup within 1–2 business days.",
      },
      {
        q: "How long does it take to get my refund?",
        a: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. It may take an additional 2–5 business days to appear in your account.",
      },
      {
        q: "Can I exchange for a different size?",
        a: "Yes! Size exchanges are available within 15 days of delivery. Contact us via WhatsApp or your account dashboard to initiate an exchange.",
      },
    ],
  },
  {
    category: "PAYMENTS",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI (Google Pay, PhonePe, Paytm), all major Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery.",
      },
      {
        q: "Is it safe to pay on CULTRAVEN?",
        a: "Absolutely. All payments are processed through Razorpay (PCI DSS Level 1 compliant). We never store your card details.",
      },
      {
        q: "My payment failed but money was deducted. What should I do?",
        a: "Failed payment deductions are automatically refunded within 5–7 business days by your bank. Do not re-attempt — contact us first to avoid duplicate charges.",
      },
    ],
  },
  {
    category: "PRODUCT CARE",
    items: [
      {
        q: "What fabric is used in CULTRAVEN products?",
        a: "All our tees are made from 260 GSM 100% combed ring-spun cotton — pre-shrunk and garment washed for a premium, lived-in feel.",
      },
      {
        q: "How do I care for my CULTRAVEN tee?",
        a: "Machine wash cold (max 30°C), inside out. Do not tumble dry — air dry flat. Do not bleach. Iron on low heat, inside out. Do not dry clean.",
      },
      {
        q: "Will the graphics fade after washing?",
        a: "Our graphics use premium screen printing designed to survive repeated washes. Wash inside out in cold water to maximize longevity.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          backgroundColor: "#172545",
          padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "0.75rem",
          }}
        >
          Help Centre
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem,6vw,5rem)",
            fontWeight: 600,
            color: "#F5F1E8",
            lineHeight: 1,
            marginBottom: "1rem",
          }}
        >
          Frequently Asked Questions
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.9rem",
            color: "rgba(245,241,232,0.65)",
            maxWidth: "500px",
          }}
        >
          Everything you need to know about shopping with CULTRAVEN. Can&apos;t find your answer? Chat with us.
        </p>
      </div>

      {/* FAQ Content */}
      <div style={{ padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)", maxWidth: "800px" }}>
        {FAQS.map((group) => (
          <div key={group.category} style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#C94227",
                marginBottom: "1.25rem",
              }}
            >
              {group.category}
            </h2>
            <div style={{ borderTop: "1px solid #D9D3C4" }}>
              {group.items.map((item, i) => {
                const id = `${group.category}-${i}`;
                const isOpen = openId === id;
                return (
                  <div key={i} style={{ borderBottom: "1px solid #D9D3C4" }}>
                    <button
                      id={`faq-btn-${id}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${id}`}
                      onClick={() => toggle(id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "1.25rem 0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        gap: "1rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 700,
                          fontSize: "0.92rem",
                          color: "#172545",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.q}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#172545"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.25s ease",
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <div
                      id={`faq-panel-${id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${id}`}
                      style={{
                        overflow: "hidden",
                        maxHeight: isOpen ? "500px" : "0",
                        transition: "max-height 0.3s ease",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.875rem",
                          lineHeight: 1.8,
                          color: "#4B5563",
                          paddingBottom: "1.25rem",
                        }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div
          style={{
            backgroundColor: "#172545",
            padding: "2.5rem",
            textAlign: "center",
            marginTop: "2rem",
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#F5F1E8",
              marginBottom: "0.75rem",
            }}
          >
            Still have questions?
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.82rem",
              color: "rgba(245,241,232,0.65)",
              marginBottom: "1.5rem",
            }}
          >
            Our support team is here Mon–Sat, 10 AM – 6 PM IST.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.875rem 1.75rem",
                backgroundColor: "#25D366",
                color: "#FFFFFF",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              WhatsApp Us
            </a>
            <a
              href="/pages/contact"
              style={{
                display: "inline-block",
                padding: "0.875rem 1.75rem",
                border: "2px solid #F5F1E8",
                color: "#F5F1E8",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
