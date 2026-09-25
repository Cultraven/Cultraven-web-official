import React from "react";
import Link from "next/link";

export default function NotFound() {
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
        textAlign: "center",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "4rem",
          textDecoration: "none",
          color: "#F5F1E8",
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

      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: "0.75rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#C94227",
          marginBottom: "1rem",
        }}
      >
        404 — OFF THE MAP
      </p>

      <h1
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(3.5rem, 10vw, 7rem)",
          lineHeight: 0.95,
          color: "#F5F1E8",
          marginBottom: "2rem",
        }}
      >
        Lost in the
        <br />
        <em style={{ color: "#C94227" }}>Shadows.</em>
      </h1>

      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "1rem",
          lineHeight: 1.7,
          color: "rgba(245,241,232,0.65)",
          marginBottom: "3rem",
          maxWidth: "460px",
        }}
      >
        This link doesn’t exist or has moved into the archives. Explore our active drops on the homepage.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "1rem 2.5rem",
          backgroundColor: "#C94227",
          color: "#F5F1E8",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: "0.75rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        RETURN TO HOMEPAGE
      </Link>
    </div>
  );
}
