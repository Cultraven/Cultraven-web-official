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
    <section style={{ backgroundColor: "#EAE6DB", padding: "clamp(4rem,8vw,8rem) 0" }}>
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
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#C94227",
            marginBottom: "1rem",
            display: "block",
          }}
        >
          JOIN THE MOVEMENT
        </span>

        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(2rem,4.5vw,3.75rem)",
            fontWeight: 600,
            color: "#172545",
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
              fontFamily: "Inter, sans-serif",
              fontSize: "0.95rem",
              color: "#6B7280",
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
              backgroundColor: "#172545",
              color: "#F5F1E8",
              fontFamily: "Inter, sans-serif",
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
                border: "2px solid #172545",
                borderRight: "none",
                backgroundColor: "#F5F1E8",
                color: "#172545",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                padding: "1rem 1.75rem",
                backgroundColor: "#172545",
                color: "#F5F1E8",
                border: "2px solid #172545",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C94227"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#C94227"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#172545"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#172545"; }}
            >
              {status === "loading" ? "..." : config.ctaLabel}
            </button>
          </form>
        )}

        {status === "error" && (
          <p style={{ marginTop: "0.75rem", fontFamily: "Inter,sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#C94227" }}>
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}
