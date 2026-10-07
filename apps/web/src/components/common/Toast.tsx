"use client";
/**
 * Toast notification system.
 * Usage: import { toast } from "@/components/common/Toast"
 * Then call: toast.success("Added to cart!")
 *
 * Rendered globally in root layout via <ToastProvider />.
 */

import React, { createContext, useContext, useCallback, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _addToast: ((msg: string, type?: ToastType) => void) | null = null;

export const toast = {
  success: (msg: string) => _addToast?.(msg, "success"),
  error: (msg: string) => _addToast?.(msg, "error"),
  info: (msg: string) => _addToast?.(msg, "info"),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let counter = 0;

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose to module-level toast helper
  _addToast = addToast;

  const bgColor = (type: ToastType) => {
    if (type === "success") return "var(--color-navy)";
    if (type === "error") return "var(--color-crimson)";
    return "#4B5563";
  };

  const icon = (type: ToastType) => {
    if (type === "success") return "✓";
    if (type === "error") return "✕";
    return "ℹ";
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          alignItems: "center",
          pointerEvents: "none",
          minWidth: "280px",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              backgroundColor: bgColor(t.type),
              color: "var(--color-cream)",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.82rem",
              letterSpacing: "0.04em",
              padding: "0.875rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              boxShadow: "0 8px 32px rgba(23,37,69,0.22)",
              animation: "toastSlide 0.3s cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: "auto",
              maxWidth: "360px",
              width: "100%",
            }}
          >
            <span style={{ fontWeight: 900, fontSize: "1rem" }}>{icon(t.type)}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
