"use client";
/**
 * Who is signed in, for the site header. One shared fetch of GET /api/account/session (no avatar bytes — just a URL),
 * refreshed on every Header mount and whenever a page dispatches `cv:account-changed` (avatar saved, logout, ...).
 * Server render + first client render are always "anonymous" so hydration never mismatches.
 */
import { useEffect, useSyncExternalStore } from "react";

export interface AccountSession { loaded: boolean; signedIn: boolean; initial: string; name: string; avatar: string | null }

export const ACCOUNT_CHANGED_EVENT = "cv:account-changed";
const ANON: AccountSession = { loaded: false, signedIn: false, initial: "", name: "", avatar: null };

let state: AccountSession = ANON;
const subs = new Set<() => void>();
let seq = 0; // only the newest response is applied (a slow stale reply must not undo a logout)

const emit = () => subs.forEach((f) => f());

export function refreshAccountSession(): Promise<void> {
  const mine = ++seq;
  return fetch("/api/account/session", { cache: "no-store", credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (mine !== seq) return;
      state = d?.signedIn
        ? { loaded: true, signedIn: true, initial: String(d.initial || "C"), name: String(d.name || ""), avatar: typeof d.avatar === "string" ? d.avatar : null }
        : { ...ANON, loaded: true };
      emit();
    })
    .catch(() => { /* keep whatever we had */ });
}

/** Tell every header (and anything else listening) that the account state changed. */
export function notifyAccountChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function useAccountSession(): AccountSession {
  const s = useSyncExternalStore(subscribe, () => state, () => ANON);
  useEffect(() => {
    // Defer a tick so it never competes with first paint / LCP.
    const t = window.setTimeout(() => { void refreshAccountSession(); }, 150);
    const onChange = () => { void refreshAccountSession(); };
    window.addEventListener(ACCOUNT_CHANGED_EVENT, onChange);
    return () => { window.clearTimeout(t); window.removeEventListener(ACCOUNT_CHANGED_EVENT, onChange); };
  }, []);
  return s;
}
