"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { HeroSlide } from "@shop/types";

interface HeroBannerProps {
  slide: HeroSlide;
  siteUrl: string;
}

export function HeroBanner({ slide: _slide, siteUrl: _siteUrl }: HeroBannerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const dropDate = new Date();
  dropDate.setDate(dropDate.getDate() + 3); // mock 3 days from now
  
  useEffect(() => {
    const timer = setInterval(() => {
      const difference = dropDate.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Campaign Hero"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "#172545",
      }}
    >
      {/* ── Background looping videos (Horizontal scroll track) ── */}
      <div
        className="hide-scrollbar"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {[
          "https://assets.mixkit.co/videos/preview/mixkit-young-man-in-streetwear-standing-outdoors-42289-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-shoes-of-a-skateboarder-doing-tricks-41689-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-urban-style-girl-with-sunglasses-42296-large.mp4"
        ].map((src, i) => (
          <div key={i} style={{ flex: "0 0 100vw", height: "100vh", scrollSnapAlign: "start", position: "relative" }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            >
              <source src={src} type="video/mp4" />
            </video>
          </div>
        ))}
      </div>

      {/* ── Gradient overlay ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(23,37,69,0.2) 0%, rgba(23,37,69,0.7) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "clamp(1.5rem, 4vw, 4rem)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {/* Drop Countdown (Sticker Style) */}
        <div
          style={{
            display: "inline-flex",
            gap: "8px",
            backgroundColor: "#F5F1E8",
            border: "var(--border-thick)",
            boxShadow: "4px 4px 0px 0px #172545",
            padding: "8px 16px",
            marginBottom: "24px",
            transform: "rotate(-2deg)",
            pointerEvents: "auto",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 900, color: "#172545", textTransform: "uppercase" }}>NEXT DROP IN:</span>
          <div style={{ display: "flex", gap: "4px", fontSize: "12px", fontWeight: 900, color: "#C94227" }}>
            <span>{timeLeft.days}D</span>:
            <span>{String(timeLeft.hours).padStart(2, "0")}H</span>:
            <span>{String(timeLeft.minutes).padStart(2, "0")}M</span>:
            <span>{String(timeLeft.seconds).padStart(2, "0")}S</span>
          </div>
        </div>

        {/* Headline — massive oversized */}
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 400,
            fontSize: "clamp(4rem, 15vw, 12rem)",
            lineHeight: 0.85,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "#F5F1E8",
            marginBottom: "32px",
            textShadow: "4px 4px 0px #172545, 8px 8px 0px rgba(23,37,69,0.5)",
          }}
        >
          ACID STATE
        </h1>

        {/* ONE CTA */}
        <div style={{ pointerEvents: "auto" }}>
          <Link href="/collections/acid-state" className="btn-primary" style={{ fontSize: "16px", padding: "16px 40px" }}>
            SHOP THE DROP
          </Link>
        </div>
      </div>

      {/* ── Scroll Label ── */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.2em", color: "#F5F1E8", textTransform: "uppercase" }}>
          SCROLL TO EXPLORE
        </span>
        <div style={{ width: "2px", height: "40px", backgroundColor: "rgba(245,241,232,0.3)", position: "relative", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "50%", backgroundColor: "#F5F1E8", animation: "scrollDown 1.5s infinite" }} />
        </div>
      </div>

      <style>{`
        @keyframes scrollDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </section>
  );
}
