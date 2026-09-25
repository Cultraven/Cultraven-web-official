/**
 * Button — shared primitive across all three apps.
 *
 * Variants:
 *   primary   — gold fill (Cultraven brand CTA)
 *   secondary — charcoal fill
 *   outline   — transparent + gold border
 *   ghost     — no border, text-only with hover underline
 *
 * Sizes: sm | md (default) | lg
 */

import React from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium tracking-wide " +
    "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed " +
    "select-none cursor-pointer";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--color-gold)] text-[var(--color-ink)] hover:bg-[var(--color-gold-light)] " +
      "active:scale-[0.98]",
    secondary:
      "bg-[var(--color-charcoal)] text-[var(--color-cream)] hover:bg-[var(--color-ink)] " +
      "active:scale-[0.98]",
    outline:
      "border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] " +
      "hover:text-[var(--color-ink)] active:scale-[0.98]",
    ghost:
      "text-[var(--color-stone)] hover:text-[var(--color-cream)] underline-offset-4 " +
      "hover:underline",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "text-[var(--text-xs)] px-3 py-1.5 rounded-[var(--radius-sm)]",
    md: "text-[var(--text-sm)] px-6 py-3 rounded-[var(--radius-sm)]",
    lg: "text-[var(--text-base)] px-8 py-4 rounded-[var(--radius-sm)]",
  };

  return (
    <button
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
