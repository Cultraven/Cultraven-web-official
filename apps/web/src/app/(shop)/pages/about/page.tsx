import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story | CULTRAVEN",
  description: "The story behind CULTRAVEN — a premium Gen-Z streetwear brand built for the generation creating its own culture.",
};

export default function AboutPage() {
  const sections = [
    {
      tag: "THE BEGINNING",
      heading: "It started with a tee.",
      body: "CULTRAVEN was born out of frustration. Frustration at fashion that asked you to blend in. Frustration at streetwear that was either too cheap or too corporate. We wanted something different — clothes that felt like they belonged to us.",
      image: "https://images.unsplash.com/photo-1512316694639-50ab2ce7b767?w=1200&auto=format&fit=crop&q=85",
      reverse: false,
    },
    {
      tag: "THE CULTURE",
      heading: "Built for the ones who create their own culture.",
      body: "We don't follow trends. We follow people — the artists, the rebels, the ones who refuse to be defined by a category. CULTRAVEN is for the generation that builds its own culture instead of borrowing someone else's.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85",
      reverse: true,
    },
    {
      tag: "THE DESIGN",
      heading: "Every detail is a decision.",
      body: "260 GSM pre-shrunk heavyweight cotton. Acid wash processes done in small batches. Screen prints that survive a hundred washes. We're obsessive about quality because the people who wear our clothes are obsessive about their identity.",
      image: "https://images.unsplash.com/photo-1572491295326-72d829dc7482?w=1200&auto=format&fit=crop&q=85",
      reverse: false,
    },
    {
      tag: "THE FUTURE",
      heading: "Not made to blend in.",
      body: "We're just getting started. More drops. More stories. More collaborations with artists, photographers and creators who refuse to be ordinary. CULTRAVEN is a movement, not a moment.",
      image: "https://images.unsplash.com/photo-1618886487325-f98f121b6192?w=1200&auto=format&fit=crop&q=85",
      reverse: true,
    },
  ];

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "70vh", minHeight: "400px", overflow: "hidden", backgroundColor: "#172545", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&auto=format&fit=crop&q=85')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.4 }} aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 10, paddingInline: "clamp(1.25rem,4vw,5rem)" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "1rem" }}>CULTRAVEN</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(3rem,8vw,7rem)", fontWeight: 600, color: "#F5F1E8", lineHeight: 0.95, letterSpacing: "-0.02em" }}>Our Story</h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "1rem", color: "rgba(245,241,232,0.7)", maxWidth: "500px", marginTop: "1.5rem", lineHeight: 1.7 }}>NOT MADE TO BLEND IN. Built for the generation creating its own culture.</p>
        </div>
      </div>

      {/* Sections */}
      {sections.map((sec, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "60vh" }} className="about-section">
          <div style={{ position: "relative", minHeight: "400px", order: sec.reverse ? 2 : 1 }}>
            <img src={sec.image} alt={sec.heading} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(3rem,6vw,7rem)", backgroundColor: i % 2 === 0 ? "#F5F1E8" : "#EAE6DB", order: sec.reverse ? 1 : 2 }}>
            <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "1.25rem" }}>{sec.tag}</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 600, color: "#172545", lineHeight: 1.1, marginBottom: "1.5rem" }}>{sec.heading}</h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", lineHeight: 1.8, color: "#4B5563", maxWidth: "420px" }}>{sec.body}</p>
          </div>
        </div>
      ))}

      {/* Brand values */}
      <div style={{ backgroundColor: "#172545", padding: "clamp(4rem,8vw,8rem) clamp(1.25rem,4vw,5rem)", textAlign: "center" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "1.5rem" }}>What we stand for</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 600, color: "#F5F1E8", marginBottom: "3rem" }}>The CULTRAVEN Values</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "2rem" }} className="values-grid">
          {[{ val: "Bold", desc: "We don't make timid clothes for timid people." }, { val: "Premium", desc: "260 GSM. Garment washed. No compromises." }, { val: "Authentic", desc: "Every design has a story that matters." }, { val: "Rebellious", desc: "Against the ordinary. Always." }].map((v) => (
            <div key={v.val} style={{ padding: "2rem", borderTop: "2px solid rgba(245,241,232,0.15)" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1.75rem", color: "#F5F1E8", marginBottom: "0.75rem" }}>{v.val}</h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "rgba(245,241,232,0.6)", lineHeight: 1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-section { grid-template-columns: 1fr !important; }
          .about-section > div { order: unset !important; }
          .values-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
