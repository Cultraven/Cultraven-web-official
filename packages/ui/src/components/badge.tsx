/**
 * Badge — shared primitive for item-count indicators and status labels.
 *
 * Usage:
 *   <Badge count={3} />          → circular count bubble
 *   <Badge label="New" />        → small text pill
 *   <Badge label="Sale" color="gold" />
 */

import React from "react";

export type BadgeColor = "gold" | "ink" | "error" | "success" | "stone";

export interface BadgeProps {
  /** Numeric count — rendered as a small circular bubble. */
  count?: number;
  /** Text label — rendered as a pill. */
  label?: string;
  color?: BadgeColor;
  className?: string;
  /** Max count shown; above this shows `max+`. Default 99. */
  maxCount?: number;
}

export function Badge({
  count,
  label,
  color = "gold",
  className = "",
  maxCount = 99,
}: BadgeProps) {
  const colorMap: Record<BadgeColor, string> = {
    gold:    "bg-[var(--color-gold)]    text-[var(--color-ink)]",
    ink:     "bg-[var(--color-ink)]     text-[var(--color-cream)]",
    error:   "bg-[var(--color-error)]   text-white",
    success: "bg-[var(--color-success)] text-white",
    stone:   "bg-[var(--color-stone)]   text-white",
  };

  if (count !== undefined) {
    const display = count > maxCount ? `${maxCount}+` : String(count);
    if (count === 0) return null;
    return (
      <span
        className={[
          "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center",
          "rounded-full text-[10px] font-bold leading-none pointer-events-none",
          colorMap[color],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`${count} item${count !== 1 ? "s" : ""}`}
      >
        {display}
      </span>
    );
  }

  if (label) {
    return (
      <span
        className={[
          "inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)]",
          "text-[var(--text-xs)] font-semibold uppercase tracking-wider leading-none",
          colorMap[color],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </span>
    );
  }

  return null;
}
