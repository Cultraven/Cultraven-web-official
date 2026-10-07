import { BrandLogo } from "@/components/common/BrandLogo";
import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-navy)",
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
          minHeight: "44px",
          gap: "0.75rem",
          marginBottom: "4rem",
          textDecoration: "none",
          color: "var(--color-cream)",
        }}
      >
        <BrandLogo height={34} tone="light" />
      </Link>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 800,
          fontSize: "0.75rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "var(--color-crimson)",
          marginBottom: "1rem",
        }}
      >
        404 — OFF THE MAP
      </p>

      <h1
        style={{
          fontFamily: "var(--font-heading)",
          
          fontWeight: 400,
          fontSize: "clamp(3.5rem, 10vw, 7rem)",
          lineHeight: 0.95,
          color: "var(--color-cream)",
          marginBottom: "2rem",
        }}
      >
        Lost in the
        <br />
        <em style={{ color: "var(--color-crimson)" }}>Shadows.</em>
      </h1>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "1rem",
          lineHeight: 1.7,
          color: "rgba(245,241,232,0.65)",
          marginBottom: "3rem",
          maxWidth: "460px",
        }}
      >
        This page doesn’t exist or may have been moved. Browse our latest products on the homepage.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "1rem 2.5rem",
          backgroundColor: "var(--color-crimson)",
          color: "var(--color-cream)",
          fontFamily: "var(--font-sans)",
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
