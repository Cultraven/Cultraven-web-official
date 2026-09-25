/**
 * Card — shared shell with hover-lift effect.
 * Intentionally minimal: pass children for full control.
 *
 * Usage:
 *   <Card hoverable>
 *     <img ... />
 *     <div className="p-4">...</div>
 *   </Card>
 */

import React from "react";
import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds scale + shadow lift on hover */
  hoverable?: boolean;
  /** Removes background (transparent card shell) */
  transparent?: boolean;
}

export function Card({
  hoverable = false,
  transparent = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "overflow-hidden rounded-[var(--radius-sm)]",
        !transparent ? "bg-[var(--color-charcoal)]" : "",
        hoverable
          ? "transition-transform duration-300 ease-[var(--ease-luxury)] " +
            "hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] cursor-pointer"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
