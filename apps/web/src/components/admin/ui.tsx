"use client";
/**
 * Admin UI primitives. Thin wrappers over the .adm-* classes in admin.css so every
 * page looks and behaves the same, with no per-page inline style objects.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ─── Icons (24px stroke set) ─────────────────────────────────────────────────
const PATHS: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  tag: <><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.3" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a2 2 0 002 1.6h7.6a2 2 0 002-1.5L21 8H6" /></>,
  layout: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  film: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>,
  ext: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  chevron: <><path d="M9 6l6 6-6 6" /></>,
  up: <><path d="M6 15l6-6 6 6" /></>,
  down: <><path d="M6 9l6 6 6-6" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>,
  trash: <><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></>,
  check: <><path d="M20 6L9 17l-5-5" /></>,
  x: <><path d="M18 6L6 18M6 6l12 12" /></>,
  rupee: <><path d="M6 4h12M6 9h12M6 4c6 0 8 2 8 5s-2 5-8 5l7 6" /></>,
  alert: <><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></>,
};
export function Icon({ name, size = 18 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] ?? null}
    </svg>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────
type Variant = "default" | "primary" | "accent" | "danger" | "danger-solid" | "ghost";
const vcls = (v: Variant, size?: "sm" | "icon") =>
  ["adm-btn", v !== "default" && `adm-btn-${v}`, size === "sm" && "adm-btn-sm", size === "icon" && "adm-btn-icon"].filter(Boolean).join(" ");

export const Button = React.memo(function Button({
  variant = "default", size, loading, icon, children, className = "", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "icon"; loading?: boolean; icon?: string }) {
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading} className={`${vcls(variant, size)} ${className}`}>
      {loading ? <span className="adm-spin" aria-hidden /> : icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
});

export function LinkButton({ href, variant = "default", size, icon, children, external }: { href: string; variant?: Variant; size?: "sm" | "icon"; icon?: string; children?: React.ReactNode; external?: boolean }) {
  const cls = vcls(variant, size);
  const inner = <>{icon ? <Icon name={icon} size={16} /> : null}{children}</>;
  return external ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : <Link className={cls} href={href} prefetch={false}>{inner}</Link>;
}

// ─── Layout bits ─────────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="adm-ph">
      <div>
        {eyebrow ? <div className="adm-ph-eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="adm-actions">{children}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children, pad = true, className = "" }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; pad?: boolean; className?: string }) {
  return (
    <section className={`adm-card ${className}`}>
      {title || actions ? <div className="adm-card-h">{title ? <h2>{title}</h2> : <span />}{actions}</div> : null}
      <div className={pad ? "adm-card-pad" : undefined}>{children}</div>
    </section>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warn" | "danger" | "info"; children: React.ReactNode }) {
  return <span className={`adm-badge ${tone !== "neutral" ? `adm-badge-${tone}` : ""}`}>{children}</span>;
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="adm-empty">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  return <div role={kind === "error" ? "alert" : "status"} className={`adm-alert adm-alert-${kind}`}><Icon name={kind === "success" ? "check" : "alert"} size={16} /><div>{children}</div></div>;
}

export function Skeleton({ h = 16, w = "100%", r }: { h?: number; w?: number | string; r?: number }) {
  return <div className="adm-skel" style={{ height: h, width: w, borderRadius: r }} />;
}
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {Array.from({ length: cols }, (_, j) => <Skeleton key={j} h={18} />)}
        </div>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="adm-switch" title={label}>
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

export function Field({ label, hint, required, children, span }: { label: string; hint?: string; required?: boolean; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={`adm-field ${span ? "adm-span-all" : ""}`}>
      <span className="adm-label">{label}{required ? <span style={{ color: "var(--a-danger)" }}> *</span> : null}</span>
      {children}
      {hint ? <span className="adm-hint">{hint}</span> : null}
    </label>
  );
}

// ─── Toasts ──────────────────────────────────────────────────────────────────
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
const ToastCtx = createContext<{ toast: (text: string, kind?: Toast["kind"]) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const toast = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = ++seq.current;
    setItems((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="adm-toasts" aria-live="polite">
        {items.map((t) => <div key={t.id} className="adm-toast" data-kind={t.kind}><Icon name={t.kind === "error" ? "alert" : "check"} size={16} /><span>{t.text}</span></div>)}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────
type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state ? (
        <div className="adm-overlay" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="adm-modal" role="alertdialog" aria-modal="true" aria-labelledby="adm-cf-t">
            <h3 id="adm-cf-t">{state.title}</h3>
            {state.message ? <p>{state.message}</p> : null}
            <div className="adm-modal-actions">
              <Button onClick={() => close(false)}>Cancel</Button>
              <Button variant={state.danger === false ? "primary" : "danger-solid"} onClick={() => close(true)} autoFocus>{state.confirmLabel ?? "Confirm"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmCtx.Provider>
  );
}

// ─── Data loading hook (abortable, error-aware) ──────────────────────────────
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(url, { cache: "no-store", signal: ac.signal })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        setData(j as T);
      })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message || "Request failed"); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [url, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1), setData };
}

export const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
