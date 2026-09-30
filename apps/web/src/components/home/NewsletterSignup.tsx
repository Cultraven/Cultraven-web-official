"use client";

import React, { useState, type FormEvent } from "react";
import type { NewsletterConfig } from "@shop/types";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSignup({ config }: { config: NewsletterConfig }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? "Failed");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <section style={{ backgroundColor: "var(--color-mist)", padding: "clamp(4rem,8vw,8rem) 0" }}>
      <div
        style={{
          paddingInline: "clamp(1.25rem,4vw,5rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 800,
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--color-crimson)",
            marginBottom: "1rem",
            display: "block",
          }}
        >
          JOIN THE MOVEMENT
        </span>

        <h2
          style={{
            fontFamily: "var(--font-heading)",
            
            fontSize: "clamp(2rem,4.5vw,3.75rem)",
            fontWeight: 600,
            color: "var(--color-navy)",
            marginBottom: "1rem",
            lineHeight: 1.05,
            maxWidth: "700px",
          }}
        >
          {config.headline}
        </h2>

        {config.subtext && (
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.95rem",
              color: "var(--color-gray)",
              marginBottom: "2.5rem",
              maxWidth: "500px",
              lineHeight: 1.6,
            }}
          >
            {config.subtext}
          </p>
        )}

        {status === "success" ? (
          <div
            style={{
              padding: "1rem 2rem",
              backgroundColor: "var(--color-navy)",
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            ✓ YOU&apos;RE SUBSCRIBED!
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "0", width: "100%", maxWidth: "520px" }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={config.placeholder}
              required
              style={{
                flex: 1,
                padding: "1rem 1.25rem",
                border: "2px solid var(--color-navy)",
                borderRight: "none",
                backgroundColor: "var(--color-cream)",
                color: "var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                padding: "1rem 1.75rem",
                backgroundColor: "var(--color-navy)",
                color: "var(--color-cream)",
                border: "2px solid var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-crimson)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-crimson)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-navy)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-navy)"; }}
            >
              {status === "loading" ? "..." : config.ctaLabel}
            </button>
          </form>
        )}

        {status === "error" && (
          <p style={{ marginTop: "0.75rem", fontFamily: "Inter,sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-crimson)" }}>
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}
