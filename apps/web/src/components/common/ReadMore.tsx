"use client";
/**
 * ReadMore — on phones a long paragraph shows only its first few lines with a "Read more" link; tapping it opens the rest.
 * On wider screens nothing is cut (the clamp only exists in the phone CSS, see .rm in styles/components.css), and the link only appears when text is really hidden.
 */
import { useEffect, useRef, useState } from "react";
import type React from "react";

export function ReadMore({ children, lines = 3, tone = "dark", className, style }: { children: string; lines?: number; tone?: "dark" | "light"; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    const check = () => {
      const el = ref.current;
      if (!el) return;
      // while open nothing is clamped, so keep the "Show less" link; while closed, look for text that does not fit
      if (!open) setCut(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [children, open, lines]);

  return (
    <>
      <p ref={ref} className={`rm ${className ?? ""}`.trim()} data-open={open ? "true" : "false"} style={{ ...style, ["--rm-lines" as string]: lines }}>
        {children}
      </p>
      {cut || open ? (
        <button type="button" className="rm-btn" data-tone={tone} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}
    </>
  );
}
