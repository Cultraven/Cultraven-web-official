import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Exchanges | CULTRAVEN",
  description:
    "CULTRAVEN returns and exchanges policy — 7-day returns, 15-day size exchanges, and hassle-free refunds.",
  alternates: { canonical: "/pages/returns" },
};

const HOW_IT_WORKS = [
  { step: "01", title: "Initiate Return", body: "Log in to your account, go to 'My Orders', select the order and click 'Return / Exchange'. Tell us what's wrong." },
  { step: "02", title: "Arrange Pickup", body: "We'll arrange a free pickup from your doorstep within 1–2 business days after your request is approved." },
  { step: "03", title: "We Inspect", body: "Once we receive the item, our quality team inspects it within 1–2 business days to confirm it meets return eligibility." },
  { step: "04", title: "Refund or Exchange", body: "Refund processed within 5–7 business days to your original payment method. Exchanges shipped immediately." },
];

const ELIGIBLE = [
  "Item is unworn and unwashed",
  "Original tags are still attached",
  "Item is in original packaging",
  "Return initiated within 7 days of delivery",
  "Item is not a sale or clearance item",
  "Item is not a custom / personalized order",
];

const NOT_ELIGIBLE = [
  "Items worn, washed or altered in any way",
  "Items without original tags",
  "Sale items (marked as SALE or CLEARANCE)",
  "Custom printed or personalized products",
  "Items returned after 7 days of delivery",
  "Items damaged due to misuse or improper care",
];

export default function ReturnsPage() {
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
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "0.75rem",
          }}
        >
          Hassle-Free
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            
            fontSize: "clamp(2.5rem,6vw,5rem)",
            fontWeight: 600,
            color: "#F5F1E8",
            lineHeight: 1,
            marginBottom: "1rem",
          }}
        >
          Returns & Exchanges
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.9rem",
            color: "rgba(245,241,232,0.65)",
          }}
        >
          7-day returns · 15-day size exchanges · Free pickup
        </p>
      </div>

      {/* Stats strip */}
      <div
        style={{
          backgroundColor: "#EAE6DB",
          padding: "2rem clamp(1.25rem,4vw,5rem)",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
        className="returns-stats"
      >
        {[
          { val: "7 Days", label: "Return Window" },
          { val: "15 Days", label: "Exchange Window" },
          { val: "Free", label: "Return Pickup" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", padding: "1rem" }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: "clamp(1.75rem,3vw,2.5rem)",
                color: "#172545",
                marginBottom: "0.25rem",
              }}
            >
              {s.val}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6B7280",
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div
        style={{
          padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 900,
            fontSize: "0.68rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "2rem",
          }}
        >
          How It Works
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
          }}
          className="returns-steps"
        >
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} style={{ paddingTop: "1.5rem", borderTop: "2px solid #172545" }}>
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: "2rem",
                  color: "#C94227",
                  marginBottom: "1rem",
                  lineHeight: 1,
                }}
              >
                {step.step}
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#172545",
                  marginBottom: "0.75rem",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.82rem",
                  lineHeight: 1.7,
                  color: "#4B5563",
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligible / Not eligible */}
      <div
        style={{
          backgroundColor: "#EAE6DB",
          padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)",
        }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}
          className="eligible-grid"
        >
          {/* Eligible */}
          <div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#172545",
                marginBottom: "1.5rem",
              }}
            >
              ✓ Eligible for Return
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {ELIGIBLE.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: "#172545",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.82rem",
                      color: "#172545",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not eligible */}
          <div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#C94227",
                marginBottom: "1.5rem",
              }}
            >
              ✗ Not Eligible for Return
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {NOT_ELIGIBLE.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: "#C94227",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.82rem",
                      color: "#4B5563",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,5rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "1rem",
          maxWidth: "640px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            
            fontSize: "clamp(1.75rem,3.5vw,2.75rem)",
            fontWeight: 600,
            color: "#172545",
          }}
        >
          Need to return something?
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.88rem",
            color: "#4B5563",
            lineHeight: 1.7,
          }}
        >
          If you have an account, head to My Orders to initiate. If you checked out as a guest or need help, our team is standing by.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="/account/orders"
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              backgroundColor: "#172545",
              color: "#F5F1E8",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            My Orders
          </a>
          <a
            href="/pages/contact"
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              border: "2px solid #172545",
              color: "#172545",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Contact Support
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .returns-stats { grid-template-columns: 1fr !important; }
          .returns-steps { grid-template-columns: 1fr 1fr !important; }
          .eligible-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .returns-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
