import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide | CULTRAVEN",
  description: "Find your perfect CULTRAVEN size. Size charts for T-Shirts, Shirts, Hoodies and Bottoms. Includes fit guide and how to measure.",
};

const SIZE_CHART = {
  tops: {
    label: "T-Shirts, Shirts & Hoodies",
    headers: ["Size", "Chest (in)", "Shoulder (in)", "Length (in)"],
    rows: [
      ["XS", "40", "17.5", "27"],
      ["S", "43", "18.5", "28"],
      ["M", "46", "19.5", "29"],
      ["L", "49", "21", "30"],
      ["XL", "52", "22", "31"],
      ["XXL", "55", "23.5", "32"],
    ],
  },
  bottoms: {
    label: "Cargos, Jeans & Trousers",
    headers: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)", "Length (in)"],
    rows: [
      ["S / 28", "28", "35", "29", "40"],
      ["M / 30", "30", "37", "29.5", "41"],
      ["L / 32", "32", "39", "30", "42"],
      ["XL / 34", "34", "41", "30.5", "43"],
      ["XXL / 36", "36", "43", "31", "44"],
    ],
  },
};

const FITS = [
  { name: "REGULAR", desc: "True to body. Follows your natural shape without excess fabric. Classic and clean." },
  { name: "RELAXED", desc: "1–2 sizes above regular. Comfortable, easygoing silhouette. Still structured." },
  { name: "OVERSIZED", desc: "Drop-shoulder, extended length, wide body. The CULTRAVEN signature silhouette. Size down for regular oversized." },
  { name: "BAGGY", desc: "Maximum volume. Extreme drop on crotch and leg opening. For the bold." },
];

export default function SizeGuidePage() {
  return (
    <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--color-navy)", padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-crimson)", marginBottom: "0.75rem" }}>FIT MATTERS</p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 600, color: "var(--color-cream)", lineHeight: 1 }}>Size Guide</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "rgba(245,241,232,0.65)", marginTop: "1rem", maxWidth: "500px" }}>All measurements are in inches. Our garments are cut oversized — read the fit guide before selecting your size.</p>
      </div>

      <div style={{ padding: "clamp(3rem,6vw,6rem) clamp(1.25rem,4vw,5rem)" }}>
        {/* How to Measure */}
        <div style={{ marginBottom: "3rem", padding: "2rem", backgroundColor: "var(--color-mist)" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "1.5rem" }}>HOW TO MEASURE</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem" }} className="measure-grid">
            {[
              { label: "CHEST", desc: "Measure around the fullest part of your chest, keeping the tape horizontal." },
              { label: "WAIST", desc: "Measure around your natural waistline, keeping the tape comfortably loose." },
              { label: "INSEAM", desc: "Measure from the crotch seam down to the bottom of the leg." },
            ].map((m) => (
              <div key={m.label}>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.5rem" }}>{m.label}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.7 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Size Tables */}
        {Object.values(SIZE_CHART).map((chart) => (
          <div key={chart.label} style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "1.25rem" }}>{chart.label}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--color-navy)" }}>
                    {chart.headers.map((h) => <th key={h} style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-cream)", padding: "0.875rem 1rem", textAlign: "left" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--color-cream)" : "var(--color-mist)" }}>
                      {row.map((cell, j) => <td key={j} style={{ fontFamily: "var(--font-sans)", fontWeight: j === 0 ? 800 : 600, fontSize: "0.82rem", color: "var(--color-navy)", padding: "0.875rem 1rem", borderBottom: "1px solid var(--color-border)" }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Fit Guide */}
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "1.5rem" }}>Fit Guide</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem" }} className="fit-grid">
            {FITS.map((f) => (
              <div key={f.name} style={{ padding: "2rem", backgroundColor: "var(--color-mist)", borderTop: "3px solid var(--color-navy)" }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.75rem" }}>{f.name}</h3>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
