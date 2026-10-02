"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { POPULAR, TOPICS, TOPIC_BY_SLUG, searchFaqs, type Faq, type Topic } from "@/lib/support";
import { ContactCards, FaqList, Icon, OrderHelp } from "@/components/help/HelpParts";

/** Help Center hub: search, optional order help, topics, popular questions, contact options. */
export default function HelpCenter({ orderId, orderNumber, hover = true }: { orderId: string | null; orderNumber: string | null; /** false = click-only accordions (variant A of the hover A/B comparison, via ?faq=click) */ hover?: boolean }) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const hits = useMemo(() => (q.length >= 2 ? searchFaqs(q) : []), [q]);
  const popular = useMemo(() => POPULAR.map((p) => { const t = TOPIC_BY_SLUG[p.topic]; const f = t.faqs.find((x) => x.q === p.q); return f ? { ...f, topic: t as Topic } : null; }).filter(Boolean) as (Faq & { topic: Topic })[], []);

  return (
    <div className="hc">
      <section className="hc-hero">
        <h1>How can we help?</h1>
        <p>Search answers about orders, delivery, returns and payments — or talk to a real person.</p>
        <form className="hc-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search e.g. cancel order, refund, size" aria-label="Search help" autoComplete="off" maxLength={80} />
          <button type="submit">Search</button>
        </form>
      </section>

      <div className="hc-wrap">
        {q.length >= 2 ? (
          <section className="hc-sec" aria-live="polite">
            <h2 className="hc-h2">{hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"} for “${q}”` : `No answers found for “${q}”`}</h2>
            {hits.length ? <FaqList from hover={hover} items={hits.map((h) => ({ ...h.faq, topic: h.topic }))} /> : <div className="hc-empty">Try different words (for example &ldquo;refund&rdquo; or &ldquo;size&rdquo;), or reach us directly below — we&apos;re happy to help.</div>}
          </section>
        ) : null}

        {orderId ? <OrderHelp orderId={orderId} orderNumber={orderNumber} /> : null}

        {q.length < 2 ? (
          <>
            <section className="hc-sec" id="topics">
              <h2 className="hc-h2">Browse by topic</h2>
              <div className="hc-topics">
                {TOPICS.map((t) => (
                  <Link key={t.slug} className="hc-topic" href={`/help/${t.slug}${orderId ? `?order=${orderNumber ?? ""}` : ""}`}>
                    <span className="ic"><Icon name={t.icon} /></span>
                    <div><b>{t.title}</b><span>{t.blurb}</span></div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="hc-sec" id="faq">
              <h2 className="hc-h2">Popular questions</h2>
              <p className="hc-hint" data-on={hover ? "true" : "false"}>Hover over a question to preview the answer · click to keep it open</p>
              <FaqList from hover={hover} items={popular} />
              <Link href="/help/faq" className="hc-more">See all questions →</Link>
            </section>
          </>
        ) : null}

        <section className="hc-sec" id="contact">
          <h2 className="hc-h2">Still need help? Talk to us</h2>
          <ContactCards orderNumber={orderNumber} />
        </section>
      </div>
    </div>
  );
}
