import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | CULTRAVEN",
  description:
    "CULTRAVEN Terms and Conditions — your agreement with us when using our website and purchasing our products.",
  alternates: { canonical: "/pages/terms" },
};

const SECTIONS = [
  {
    heading: "Acceptance of Terms",
    body: `By accessing and using the CULTRAVEN website (cultraven.com) and making purchases, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.\n\nThese terms apply to all visitors, users, and customers of CULTRAVEN.`,
  },
  {
    heading: "Products & Pricing",
    body: `• All prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes (GST).\n
• We reserve the right to change prices at any time without notice. Price changes will not affect already-placed orders.\n
• We make every effort to display product colours and images accurately, but we cannot guarantee your device's screen will display colours accurately.\n
• Product availability is subject to stock levels. We are not liable for items going out of stock after your order.`,
  },
  {
    heading: "Orders & Payments",
    body: `• An order is only confirmed once you receive an order confirmation email from us.\n
• We accept payments via UPI, Credit/Debit Cards, Net Banking, Wallets (via Razorpay), and Cash on Delivery.\n
• In case of payment failure, please contact us before attempting another payment to avoid duplicate charges.\n
• We reserve the right to cancel orders if payment cannot be verified or if we suspect fraudulent activity.\n
• Prices shown during checkout are final and binding once the order is placed.`,
  },
  {
    heading: "Shipping",
    body: `• We ship across India only. International shipping is not currently available.\n
• Delivery timelines are estimates and not guaranteed. Delays may occur due to unforeseen circumstances (e.g., natural disasters, logistics disruptions).\n
• Risk of loss and title for products passes to you upon delivery.\n
• CULTRAVEN is not responsible for delays caused by incorrect shipping addresses provided by customers.`,
  },
  {
    heading: "Returns & Refunds",
    body: `• We offer a 7-day return policy for items that are unworn, unwashed, and have original tags attached.\n
• Sale items, intimate wear, and custom-order items are not eligible for returns.\n
• Refunds are processed within 5–7 business days after we receive the returned item.\n
• Original shipping charges are non-refundable unless the return is due to a defect on our part.\n
• For exchanges, we allow size exchanges within 15 days of delivery.`,
  },
  {
    heading: "Intellectual Property",
    body: `All content on this website — including text, graphics, logos, images, designs, product names, and software — is the property of CULTRAVEN or its content suppliers and is protected by Indian copyright law.\n\nYou may not reproduce, distribute, modify, or create derivative works from our content without express written permission.`,
  },
  {
    heading: "User Accounts",
    body: `• You are responsible for maintaining the confidentiality of your account and password.\n
• You must notify us immediately of any unauthorized use of your account.\n
• CULTRAVEN reserves the right to terminate accounts that violate these terms or engage in fraudulent activity.\n
• You must provide accurate, current, and complete information when creating an account.`,
  },
  {
    heading: "Limitation of Liability",
    body: `To the maximum extent permitted by applicable Indian law:\n
• CULTRAVEN shall not be liable for any indirect, incidental, special, or consequential damages.\n
• Our total liability to you shall not exceed the amount paid for the specific product giving rise to the claim.\n
• We are not responsible for any loss or damage caused by third-party services (payment gateways, shipping partners, etc.).`,
  },
  {
    heading: "Governing Law",
    body: `These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.`,
  },
  {
    heading: "Changes to Terms",
    body: `We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on our website. Your continued use of the website after changes constitutes acceptance of the new terms.\n\nLast updated: September 2026.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      <div
        style={{
          backgroundColor: "#172545",
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
            color: "#C94227",
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
            color: "#F5F1E8",
            lineHeight: 1,
          }}
        >
          Terms & Conditions
        </h1>
      </div>

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
            backgroundColor: "#EAE6DB",
            borderLeft: "3px solid #C94227",
          }}
        >
          Please read these Terms and Conditions carefully before using the CULTRAVEN website or making a purchase. These terms constitute a binding legal agreement between you and CULTRAVEN.
        </p>

        {SECTIONS.map((sec, i) => (
          <div
            key={i}
            style={{
              paddingBottom: "2.5rem",
              marginBottom: "2.5rem",
              borderBottom: i < SECTIONS.length - 1 ? "1px solid #D9D3C4" : "none",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "0.82rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#172545",
                marginBottom: "0.875rem",
              }}
            >
              {i + 1}. {sec.heading}
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

        <div style={{ backgroundColor: "#172545", padding: "2rem" }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.78rem",
              color: "#F5F1E8",
              marginBottom: "0.5rem",
            }}
          >
            Questions about these terms?
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.82rem",
              color: "rgba(245,241,232,0.7)",
            }}
          >
            Contact us at{" "}
            <a
              href="mailto:legal@cultraven.com"
              style={{ color: "#C94227", textDecoration: "underline" }}
            >
              legal@cultraven.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
