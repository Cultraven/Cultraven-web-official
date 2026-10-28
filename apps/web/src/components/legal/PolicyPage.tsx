/**
 * PolicyPage — the one layout for Terms, Privacy, Shipping and Returns.
 * Every word comes from the database (page.terms / page.privacy / page.shipping / page.returns, edited in Admin → Website content).
 * Wide two-column reading layout: a "On this page" list on the left (desktop), the text on the right.
 */
import React from "react";
import Link from "next/link";
import { parseInline, parseRichText, isSafeHref, type Inline } from "@/lib/rich-text";
import "./legal.css";

export interface PolicyData {
  eyebrow?: string; title: string; subtitle?: string; metaDescription?: string; updated?: string; numbered?: boolean; intro?: string;
  highlights?: { icon?: string; title: string; subtitle?: string }[];
  stepsHeading?: string; steps?: { title: string; body?: string; active?: boolean }[];
  columns?: { heading: string; tone?: string; items?: string }[];
  sections?: { heading: string; body?: string; active?: boolean }[];
  contactTitle?: string; contactText?: string; contactLabel?: string; contactHref?: string; contactLabel2?: string; contactHref2?: string;
}

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.t === "b") return <strong key={i}>{n.v}</strong>;
        if (n.t === "i") return <em key={i}>{n.v}</em>;
        if (n.t === "a") {
          const external = /^https:\/\//i.test(n.href);
          return n.href.startsWith("/") ? <Link key={i} href={n.href}>{n.v}</Link> : <a key={i} href={n.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{n.v}</a>;
        }
        return <React.Fragment key={i}>{n.v}</React.Fragment>;
      })}
    </>
  );
}

/** Rich text → paragraphs and bullet lists (never raw HTML). */
export function RichText({ text }: { text: string }) {
  const blocks = parseRichText(text);
  return (
    <>
      {blocks.map((b, i) =>
        b.t === "ul" ? (
          <ul key={i}>{b.items.map((it, j) => <li key={j}><Inlines nodes={it} /></li>)}</ul>
        ) : (
          <p key={i}>{b.lines.map((l, j) => <React.Fragment key={j}>{j > 0 ? <br /> : null}<Inlines nodes={l} /></React.Fragment>)}</p>
        )
      )}
    </>
  );
}

function CtaButton({ label, href, primary }: { label?: string; href?: string; primary?: boolean }) {
  if (!label || !href || !isSafeHref(href)) return null;
  const cls = primary ? "lg-btn lg-btn-primary" : "lg-btn";
  return href.startsWith("/") ? <Link href={href} className={cls}>{label}</Link> : <a href={href} className={cls}>{label}</a>;
}

export function PolicyPage({ data }: { data: PolicyData }) {
  const sections = (data.sections ?? []).filter((s) => s.active !== false && s.heading);
  const steps = (data.steps ?? []).filter((s) => s.active !== false && s.title);
  const columns = (data.columns ?? []).filter((c) => c.heading).slice(0, 2);
  const highlights = (data.highlights ?? []).filter((h) => h.title);
  const label = (i: number, h: string) => (data.numbered ? `${i + 1}. ${h}` : h);
  const hasContact = !!(data.contactTitle || data.contactText || (data.contactLabel && data.contactHref));

  return (
    <div className="lg-page">
      <header className="lg-hero">
        <div className="lg-wrap">
          {data.eyebrow ? <p className="lg-eyebrow">{data.eyebrow}</p> : null}
          <h1>{data.title}</h1>
          {data.subtitle ? <p className="lg-sub">{data.subtitle}</p> : null}
          {data.updated ? <p className="lg-updated">{data.updated}</p> : null}
        </div>
      </header>

      {highlights.length ? (
        <div className="lg-highlights">
          <div className="lg-wrap lg-hl-grid" style={{ ["--lg-cols" as string]: Math.min(highlights.length, 4) }}>
            {highlights.map((h, i) => (
              <div key={i} className="lg-hl">
                {h.icon ? <span className="lg-hl-icon" aria-hidden="true">{h.icon}</span> : null}
                <p className="lg-hl-title">{h.title}</p>
                {h.subtitle ? <p className="lg-hl-sub">{h.subtitle}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {steps.length ? (
        <section className="lg-wrap lg-steps-block">
          {data.stepsHeading ? <h2 className="lg-kicker">{data.stepsHeading}</h2> : null}
          <ol className="lg-steps" style={{ ["--lg-cols" as string]: Math.min(steps.length, 4) }}>
            {steps.map((s, i) => (
              <li key={i} className="lg-step">
                <span className="lg-step-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                {s.body ? <div className="lg-rt"><RichText text={s.body} /></div> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {columns.length ? (
        <section className="lg-cols-band">
          <div className="lg-wrap lg-cols">
            {columns.map((c, i) => (
              <div key={i} className="lg-col" data-tone={c.tone === "bad" ? "bad" : "good"}>
                <h2 className="lg-kicker">{c.heading}</h2>
                <ul>
                  {(c.items ?? "").split("\n").map((t) => t.trim()).filter(Boolean).map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.intro || sections.length ? (
        <div className={`lg-wrap lg-doc${sections.length > 1 ? "" : " lg-doc-solo"}`}>
          {sections.length > 1 ? (
            <aside className="lg-toc" aria-label="On this page">
              <p className="lg-toc-h">On this page</p>
              <ol>
                {sections.map((s, i) => <li key={i}><a href={`#sec-${i + 1}`}>{label(i, s.heading)}</a></li>)}
              </ol>
            </aside>
          ) : null}

          <div className="lg-body">
            {sections.length > 1 ? (
              <details className="lg-toc-m">
                <summary>Jump to a section</summary>
                <ol>
                  {sections.map((s, i) => <li key={i}><a href={`#sec-${i + 1}`}>{label(i, s.heading)}</a></li>)}
                </ol>
              </details>
            ) : null}

            {data.intro ? <div className="lg-intro lg-rt"><RichText text={data.intro} /></div> : null}

            {sections.map((s, i) => (
              <section key={i} id={`sec-${i + 1}`} className="lg-sec">
                <h2>{label(i, s.heading)}</h2>
                <div className="lg-rt"><RichText text={s.body ?? ""} /></div>
              </section>
            ))}

            {hasContact ? (
              <div className="lg-contact">
                {data.contactTitle ? <p className="lg-contact-h">{data.contactTitle}</p> : null}
                {data.contactText ? <p className="lg-contact-t">{data.contactText}</p> : null}
                <div className="lg-contact-btns">
                  <CtaButton label={data.contactLabel} href={data.contactHref} primary />
                  <CtaButton label={data.contactLabel2} href={data.contactHref2} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
