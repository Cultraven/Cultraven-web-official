/** Instant feedback while a storefront page streams in (navigation feels immediate). */
export default function ShopLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ padding: "clamp(1.25rem,4vw,5rem)", minHeight: "60vh" }}>
      <div className="skel" style={{ height: 14, width: 120, marginBottom: 18 }} />
      <div className="skel" style={{ height: 44, width: "min(520px,70%)", marginBottom: 32 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="skel" style={{ aspectRatio: "4/5", width: "100%", marginBottom: 12 }} />
            <div className="skel" style={{ height: 14, width: "80%", marginBottom: 8 }} />
            <div className="skel" style={{ height: 14, width: "40%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
