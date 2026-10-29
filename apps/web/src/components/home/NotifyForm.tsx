"use client";
/**
 * NotifyForm: "tell me when it drops". Saves the address to the same newsletter list the footer form uses (POST /api/newsletter),
 * so the shop owner sees these sign-ups in one place.
 */
import React, { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export function NotifyForm({ idPrefix = "notify", interest = "" }: { idPrefix?: string; interest?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function send() {
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), interest, page: typeof window !== "undefined" ? window.location.pathname : "" }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setStatus("done"); return; }
      setStatus("error");
      setMessage(typeof data?.message === "string" && data.message ? data.message : "Something went wrong. Please try again.");
    } catch {
      setStatus("error");
      setMessage("No connection. Please check your internet and try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="scs-done" role="status">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        You&apos;re on the list. We&apos;ll email you the moment it drops.
      </p>
    );
  }

  return (
    <form className="scs-form" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <label htmlFor={`${idPrefix}-email`} className="scs-sr">Email address</label>
      <input
        id={`${idPrefix}-email`}
        className="scs-input"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        maxLength={254}
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status === "error" || undefined}
        aria-describedby={status === "error" ? `${idPrefix}-err` : undefined}
      />
      {/* type="button" on purpose: the storefront's global submit-button style (navy) would disappear on the navy bar. Enter in the box still submits the form. */}
      <button className="scs-btn" type="button" disabled={status === "sending"} onClick={(e) => { if (e.currentTarget.form?.reportValidity()) void send(); }}>{status === "sending" ? "Saving…" : "Notify me"}</button>
      {status === "error" ? <p id={`${idPrefix}-err`} className="scs-err" role="alert">{message}</p> : null}
    </form>
  );
}
