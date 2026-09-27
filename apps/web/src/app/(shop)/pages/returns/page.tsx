import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Exchanges | CULTRAVEN",
  description: "CULTRAVEN returns and exchange policy — 7-day easy returns, size exchanges, and refund timelines.",
};

export default function ReturnsPage() {
  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      <div style={{ backgroundColor: "#172545", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.75rem" }}>EASY PROCESS</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 1 }}>Returns & Exchanges</h1>
      </div>

      <div style={{ padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)", maxWidth: "780px" }}>
        {/* Return process steps */}
        <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#172545", marginBottom: "2rem" }}>HOW IT WORKS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem", marginBottom: "3rem" }} className="steps-grid">
          {[{ step: "01", title: "Initiate Return", desc: "Log in to your account, go to Orders, select the item and click 'Return / Exchange'." }, { step: "02", title: "Pack & Drop Off", desc: "Repack the item with original tags attached. Drop it at the nearest courier partner." }, { step: "03", title: "Get Refund", desc: "Refund processed within 5–7 business days to your original payment method." }].map((s) => (
            <div key={s.step} style={{ borderTop: "3px solid #C94227", paddingTop: "1.25rem" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#EAE6DB" }}>{s.step}</span>
              <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#172545", marginTop: "0.5rem", marginBottom: "0.625rem" }}>{s.title}</h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Policy details */}
        {[
          { heading: "Return Window", body: "We accept returns within 7 days of delivery. The item must be unworn, unwashed and returned with all original tags attached." },
          { heading: "Exchange Window", body: "Size exchanges are accepted within 15 days of delivery. You can exchange for any available size of the same product. Subject to stock availability." },
          { heading: "Non-Returnable Items", body: "Sale items, gift cards and items marked as 'Final Sale' are not eligible for return or exchange. Innerwear, socks and accessories are not returnable for hygiene reasons." },
          { heading: "Refund Timeline", body: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. The amount is credited to your original payment method. COD refunds are issued as store credit." },
          { heading: "Damaged or Wrong Item", body: "If you received a damaged or incorrect item, contact us within 48 hours of delivery with photos. We will arrange a free replacement or full refund immediately." },
        ].map((sec, i, arr) => (
          <div key={i} style={{ paddingBottom: "2.5rem", marginBottom: "2.5rem", borderBottom: i < arr.length - 1 ? "1px solid #D9D3C4" : "none" }}>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#172545", marginBottom: "0.875rem" }}>{sec.heading}</h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", lineHeight: 1.8, color: "#4B5563" }}>{sec.body}</p>
          </div>
        ))}

        <div style={{ backgroundColor: "#EAE6DB", padding: "2rem", marginTop: "1rem" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#172545", marginBottom: "0.5rem" }}>Need Help?</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#4B5563", marginBottom: "1rem" }}>Email us at <strong>returns@cultraven.com</strong> or reach out through the contact page.</p>
          <a href="/contact" style={{ display: "inline-block", padding: "0.75rem 1.75rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>CONTACT SUPPORT</a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .steps-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
