"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Confetti from "react-confetti";

export default function OrderSuccessPage() {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div style={{ backgroundColor: "#F5F1E8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {windowDimensions.width > 0 && (
        <Confetti width={windowDimensions.width} height={windowDimensions.height} colors={["#172545", "#C94227", "#EAE6DB", "#FFFFFF"]} recycle={false} numberOfPieces={400} gravity={0.15} />
      )}
      
      <div style={{ backgroundColor: "#FFFFFF", padding: "clamp(3rem,5vw,5rem)", maxWidth: "600px", width: "100%", textAlign: "center", border: "1px solid #D9D3C4", zIndex: 10 }}>
        <div style={{ width: "64px", height: "64px", backgroundColor: "#172545", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C94227", marginBottom: "0.75rem" }}>ORDER CONFIRMED</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 600, color: "#172545", lineHeight: 1.1, marginBottom: "1.5rem" }}>Thank you for your purchase.</h1>
        
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", color: "#4B5563", lineHeight: 1.7, marginBottom: "2.5rem" }}>Your order <strong>#CR-89242</strong> has been successfully placed. We'll send a confirmation email to <strong>rohan.sharma@example.com</strong> shortly with your order details and tracking link.</p>
        
        <div style={{ backgroundColor: "#EAE6DB", padding: "1.5rem", marginBottom: "2.5rem", textAlign: "left" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#172545", marginBottom: "1rem", borderBottom: "1px solid #D9D3C4", paddingBottom: "0.5rem" }}>DELIVERY TO</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#172545", lineHeight: 1.6 }}>Rohan Sharma<br/>A-14, Hauz Khas Enclave<br/>New Delhi, Delhi 110016<br/>India</p>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
          <Link href="/collections/all" style={{ display: "inline-block", width: "100%", padding: "1.1rem", backgroundColor: "#172545", color: "#F5F1E8", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>CONTINUE SHOPPING</Link>
          <Link href="/account/orders" style={{ display: "inline-block", width: "100%", padding: "1.1rem", backgroundColor: "transparent", color: "#172545", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", border: "2px solid #172545" }}>VIEW ORDER HISTORY</Link>
        </div>
      </div>
    </div>
  );
}
