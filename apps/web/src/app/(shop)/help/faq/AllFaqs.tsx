"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { TOPICS, searchFaqs } from "@/lib/support";
import { ContactCards, FaqList } from "@/components/help/HelpParts";

/** All questions on one page: search, topic filter pills, expand/collapse all. */
export default function AllFaqs({ hover = true }: { hover?: boolean }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("all");
  const [expandAll, setExpandAll] = useState(false);
  const q = query.trim();
  const hits = useMemo(() => (q.length >= 2 ? searchFaqs(q, TOPICS, 40) : []), [q]);
  const total = TOPICS.reduce((n, t) => n + t.faqs.length, 0);
  const shown = TOPICS.filter((t) => topic === "all" || t.slug === topic);

  return (
    <div className="hc">
      <section className="hc-hero">
        <div className="hc-crumbs" style={{ color: "rgba(250,249,246,0.8)" }}>
          <Link href="/help" style={{ color: "var(--color-cream)" }}>Help Center</Link> / All questions
        </div>
        <h1>All questions</h1>
        <p>{total} answers on orders, delivery, cancellation, returns, payments, your account and sizing.</p>
        <form className="hc-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all questions" aria-label="Search all questions" autoComplete="off" maxLength={80} />
          <button type="submit">Search</button>
        </form>
      </section>

      <div className="hc-wrap">
        {q.length >= 2 ? (
          <section className="hc-sec" aria-live="polite">
            <h2 className="hc-h2">{hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"} for “${q}”` : `No answers found for “${q}”`}</h2>
            {hits.length ? <FaqList from hover={hover} forceOpen={expandAll} items={hits.map((h) => ({ ...h.faq, topic: h.topic }))} /> : <div className="hc-empty">Try different words, or reach us directly below — we&apos;re happy to help.</div>}
          </section>
        ) : (
          <>
            <div className="hc-pills" role="group" aria-label="Filter by topic">
              <button type="button" className="hc-pill" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>All ({total})</button>
              {TOPICS.map((t) => <button key={t.slug} type="button" className="hc-pill" aria-pressed={topic === t.slug} onClick={() => setTopic(t.slug)}>{t.title} ({t.faqs.length})</button>)}
            </div>
            <div className="hc-bar">
              <p className="hc-hint" data-on={hover ? "true" : "false"} style={{ margin: 0 }}>Hover over a question to preview the answer · click to keep it open</p>
              <button type="button" className="hc-link" onClick={() => setExpandAll((v) => !v)} aria-pressed={expandAll}>{expandAll ? "Collapse all" : "Expand all"}</button>
            </div>
            {shown.map((t) => (
              <section key={t.slug} className="hc-sec" id={t.slug}>
                <h2 className="hc-h2"><Link href={`/help/${t.slug}`} style={{ color: "inherit" }}>{t.title}</Link></h2>
                <FaqList hover={hover} forceOpen={expandAll} items={t.faqs} />
              </section>
            ))}
          </>
        )}

        <section className="hc-sec" id="contact">
          <h2 className="hc-h2">Didn&apos;t find it? Talk to us</h2>
          <ContactCards />
        </section>
      </div>
    </div>
  );
}
