import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { FooterConfig } from "@shop/types";

interface FooterProps {
  config: FooterConfig;
}

const SOCIAL_ICONS: Record<
  string,
  React.ReactElement
> = {
  instagram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  facebook: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  ),
  twitter: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
    </svg>
  ),
  youtube: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
      <polygon fill="currentColor" stroke="none" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  ),
};

export function Footer({ config }: FooterProps) {
  return (
    <footer
      aria-label="Site footer"
      className="bg-[var(--color-black)] text-[var(--color-white)]"
    >
      <div className="container-full px-6 md:px-12 py-20">

        <div className="grid gap-16 lg:grid-cols-4">
          {/* Logo + brand description */}
          <div className="col-span-full lg:col-span-1">
            <Link
              href="/"
              aria-label="CULTRAVEN home"
              className="flex items-center gap-2 mb-8 group"
            >
              <div className="w-10 h-10 border-2 border-[var(--color-white)] flex items-center justify-center group-hover:bg-[var(--color-white)] group-hover:text-[var(--color-black)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
                  <path d="M12 21V12M12 12L4 4M12 12L20 4" />
                </svg>
              </div>
              <span className="font-display text-2xl font-black tracking-widest uppercase">
                CULTRAVEN
              </span>
            </Link>
            
            <p className="text-[var(--text-sm)] text-[var(--color-gray)] leading-relaxed mb-8 max-w-sm font-medium">
              Everyday heavyweight streetwear. Built for the movement. 
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-6">
              {config.socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow CULTRAVEN on ${social.platform}`}
                  className="text-[var(--color-white)] hover:text-[var(--color-gray)] transition-colors"
                >
                  {SOCIAL_ICONS[social.platform]}
                </a>
              ))}
            </div>
          </div>

          {/* CMS-driven columns */}
          <div className="col-span-full lg:col-span-3 grid gap-12 sm:grid-cols-2 md:grid-cols-3">
            {config.columns.map((col) => (
              <div key={col.id}>
                <h3 className="font-display text-[13px] font-black uppercase tracking-widest text-[var(--color-gray)] mb-6">
                  {col.heading}
                </h3>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={link.openInNew ? "_blank" : undefined}
                        rel={link.openInNew ? "noopener noreferrer" : undefined}
                        className="font-display text-[14px] font-bold tracking-wide uppercase text-[var(--color-white)] hover:text-[var(--color-gray)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div className="border-t-2 border-[var(--color-white)]/10 py-8">
        <div className="container-full px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="font-display text-[11px] font-bold tracking-widest uppercase text-[var(--color-gray)]">
            {config.copyrightText}
          </p>

          {config.badgeLogos && config.badgeLogos.length > 0 && (
            <div className="flex items-center gap-4">
              {config.badgeLogos.map((logo) => (
                <Image
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  width={48}
                  height={32}
                  className="opacity-40 grayscale"
                  style={{ objectFit: "contain" }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
