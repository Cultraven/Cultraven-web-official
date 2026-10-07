import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "CULTRAVEN's privacy policy — how we collect, use and protect your personal data. Read our commitment to your privacy.",
  alternates: { canonical: "/pages/privacy" },
};

const SECTIONS = [
  {
    heading: "Information We Collect",
    body: `We collect information you provide directly to us:\n
• **Account information**: Name, email address, phone number, and password when you create an account.\n
• **Order information**: Shipping address, billing details, and payment information processed securely through Razorpay.\n
• **Usage data**: Pages visited, products viewed, time spent, browser type, IP address, and device information.\n
• **Communications**: Messages you send to our support team via WhatsApp, email, or our contact form.`,
  },
  {
    heading: "How We Use Your Information",
    body: `We use the information we collect to:\n
• Process and fulfill your orders, including sending order confirmations and shipping updates.\n
• Provide customer support and respond to your inquiries.\n
• Send promotional communications (only with your consent).\n
• Improve our website, products, and services.\n
• Detect and prevent fraudulent transactions and abuse.\n
• Comply with legal obligations under Indian law.`,
  },
  {
    heading: "Data Sharing",
    body: `We do NOT sell your personal data to third parties. We share your information only with:\n
• **Shipping partners** (Delhivery, Shiprocket) to fulfill your orders.\n
• **Payment processors** (Razorpay) to process payments securely.\n
• **Email/SMS providers** to send you transactional and marketing communications.\n
• **Analytics providers** (Google Analytics, Meta Pixel) in anonymized/aggregated form.\n
• **Legal authorities** when required by Indian law or valid court orders.`,
  },
  {
    heading: "Cookies & Tracking",
    body: `We use cookies and similar technologies to:\n
• Remember your cart items and preferences.\n
• Analyze site traffic and usage patterns.\n
• Serve personalized advertisements.\n\n
You can control cookies through your browser settings. Our Cookie Consent banner allows you to accept or decline non-essential cookies.`,
  },
  {
    heading: "Data Security",
    body: `We implement industry-standard security measures:\n
• All data is transmitted over HTTPS (TLS encryption).\n
• Passwords are hashed using bcrypt — we never store plain-text passwords.\n
• Payment data is handled by Razorpay (PCI DSS compliant) — we never store card numbers.\n
• We regularly audit our security practices.`,
  },
  {
    heading: "Your Rights",
    body: `Under Indian IT rules and applicable data protection laws, you have the right to:\n
• **Access** the personal data we hold about you.\n
• **Correct** inaccurate or incomplete information.\n
• **Delete** your account and associated personal data.\n
• **Opt-out** of marketing communications at any time.\n\n
To exercise these rights, email us at privacy@cultraven.com.`,
  },
  {
    heading: "Data Retention",
    body: `We retain your personal data for as long as necessary to:\n
• Maintain your account and provide services.\n
• Comply with our legal obligations (e.g., GST records: 8 years).\n
• Resolve disputes and enforce agreements.\n\n
Order data is retained for 8 years for tax compliance. Account data is deleted within 30 days of account deletion request.`,
  },
  {
    heading: "Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our website. Your continued use of CULTRAVEN after changes constitutes acceptance of the updated policy.\n\nLast updated: September 2026.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Hero */}
      <div
        style={{
          backgroundColor: "var(--color-navy)",
          padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--color-crimson)",
            marginBottom: "0.75rem",
          }}
        >
          Legal
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            
            fontSize: "clamp(2.5rem,6vw,5rem)",
            fontWeight: 600,
            color: "var(--color-cream)",
            lineHeight: 1,
          }}
        >
          Privacy Policy
        </h1>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)",
          maxWidth: "760px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.9rem",
            lineHeight: 1.8,
            color: "#4B5563",
            marginBottom: "3rem",
            padding: "1.25rem 1.5rem",
            backgroundColor: "var(--color-mist)",
            borderLeft: "3px solid var(--color-crimson)",
          }}
        >
          At CULTRAVEN, your privacy matters as much as the quality of our clothes. This policy explains how we handle your personal information when you shop with us or interact with our services.
        </p>

        {SECTIONS.map((sec, i) => (
          <div
            key={i}
            style={{
              paddingBottom: "2.5rem",
              marginBottom: "2.5rem",
              borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "0.82rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--color-navy)",
                marginBottom: "0.875rem",
              }}
            >
              {sec.heading}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                lineHeight: 1.8,
                color: "#4B5563",
                whiteSpace: "pre-line",
              }}
            >
              {sec.body}
            </p>
          </div>
        ))}

        <div style={{ backgroundColor: "var(--color-navy)", padding: "2rem" }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.78rem",
              color: "var(--color-cream)",
              marginBottom: "0.5rem",
            }}
          >
            Questions about this policy?
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.82rem",
              color: "rgba(245,241,232,0.7)",
              marginBottom: "1rem",
            }}
          >
            Email us at{" "}
            <a
              href="mailto:privacy@cultraven.com"
              style={{ color: "var(--color-crimson)", textDecoration: "underline" }}
            >
              privacy@cultraven.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
