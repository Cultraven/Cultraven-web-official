/**
 * ComingSoon — Shared full-page coming-soon screen.
 * Used by all stub routes until the real page is built.
 * Accepts a `page` name and optional `launchDate`.
 */

"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";

interface ComingSoonProps {
  page?: string;
  description?: string;
  showNotify?: boolean;
}

export function ComingSoon({
  page = "This page",
  description = "We're crafting something different. Something that doesn't follow the crowd.",
  showNotify = true,
}: ComingSoonProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#172545",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Raven silhouette BG — subtle SVG watermark */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        style={{
          position: "absolute",
          width: "min(600px, 90vw)",
          height: "min(600px, 90vw)",
          opacity: 0.04,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      >
        <path
          d="M200 50 C120 80 60 140 80 200 C100 260 60 280 40 360 C100 320 140 340 160 300 C170 320 160 350 180 370 C190 350 185 330 200 310 C215 330 210 350 220 370 C240 350 230 320 240 300 C260 340 300 320 360 360 C340 280 300 260 320 200 C340 140 280 80 200 50Z"
          fill="#F5F1E8"
        />
      </svg>

      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "4rem",
          textDecoration: "none",
          color: "#F5F1E8",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "2px solid #F5F1E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 21V12M12 12L4 4M12 12L20 4" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "1.1rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          CULTRAVEN
        </span>
      </Link>

      {/* Main content */}
      <div style={{ textAlign: "center", maxWidth: "600px", zIndex: 1 }}>
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "1.5rem",
          }}
        >
          {page} — COMING SOON
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(3rem, 9vw, 6rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            color: "#F5F1E8",
            marginBottom: "2rem",
          }}
        >
          Dropping
          <br />
          <em style={{ color: "#C94227" }}>Soon.</em>
        </h1>

        {/* Description */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "rgba(245,241,232,0.65)",
            marginBottom: "3rem",
            maxWidth: "440px",
            marginInline: "auto",
          }}
        >
          {description}
        </p>

        {/* Notify form */}
        {showNotify && (
          submitted ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 2rem",
                border: "2px solid #C94227",
                color: "#C94227",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              YOU&apos;RE ON THE LIST
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", gap: 0, width: "100%", maxWidth: "440px", marginInline: "auto" }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email — be first to know"
                required
                style={{
                  flex: 1,
                  padding: "1rem 1.25rem",
                  backgroundColor: "rgba(245,241,232,0.08)",
                  border: "2px solid rgba(245,241,232,0.25)",
                  borderRight: "none",
                  color: "#F5F1E8",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "1rem 1.5rem",
                  backgroundColor: "#C94227",
                  color: "#F5F1E8",
                  border: "2px solid #C94227",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                NOTIFY ME
              </button>
            </form>
          )
        )}

        {/* Back home */}
        <div style={{ marginTop: "3rem" }}>
          <Link
            href="/"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(245,241,232,0.45)",
              borderBottom: "1px solid rgba(245,241,232,0.25)",
              paddingBottom: "2px",
              textDecoration: "none",
            }}
          >
            ← BACK TO HOMEPAGE
          </Link>
        </div>
      </div>

      {/* Bottom brand tagline */}
      <p
        style={{
          position: "absolute",
          bottom: "2rem",
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: "0.65rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(245,241,232,0.2)",
          zIndex: 1,
        }}
      >
        CULTRAVEN — WEAR YOUR DIFFERENCE
      </p>
    </div>
  );
}
