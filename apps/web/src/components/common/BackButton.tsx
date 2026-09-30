"use client";
import React from "react";
import { useRouter } from "next/navigation";

/** Goes back in the browser history; if there is none (new tab / direct visit) it goes to `fallbackHref`. */
export function BackButton({ fallbackHref = "/", label = "Back", className = "cv-btn cv-btn-outline cv-btn-sm" }: { fallbackHref?: string; label?: string; className?: string }) {
  const router = useRouter();
  const go = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };
  return (
    <button type="button" onClick={go} className={className} aria-label={`${label} to the previous page`}>
      <svg className="cv-arrow-back" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </button>
  );
}
