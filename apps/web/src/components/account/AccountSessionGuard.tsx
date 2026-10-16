"use client";
/**
 * Keeps an open account page honest. If the account is deleted or deactivated while the page is open, the next screen the customer
 * looks at would only show errors. This checks the session when the tab comes back into view (and every couple of minutes while it
 * stays open) and, when the account is gone, sends the customer to the login page instead.
 */
import { useEffect } from "react";

const RECHECK_MS = 2 * 60 * 1000;

export function AccountSessionGuard() {
  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/account/session", { cache: "no-store", credentials: "same-origin" });
        if (!r.ok) return; // a network or server hiccup is not "signed out"
        const d = await r.json();
        if (!stopped && d?.signedIn === false) window.location.assign("/api/auth/expired");
      } catch { /* offline: try again later */ }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = window.setInterval(() => { void check(); }, RECHECK_MS);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
