import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/styles/help.css";
import { TOPICS, TOPIC_BY_SLUG, cleanOrderNumber } from "@/lib/support";
import { ContactCards, FaqList, Icon } from "@/components/help/HelpParts";

interface Props { params: Promise<{ topic: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

// Unknown topics are a real 404 (not a soft 200 page).
export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const t = TOPIC_BY_SLUG[topic];
  return t ? { title: `${t.title} — Help Center`, description: t.blurb, alternates: { canonical: `/help/${t.slug}` } } : { title: "Help Center" };
}

/** /help/<topic> — every question in one topic, with contact options underneath. */
export default async function HelpTopicPage({ params, searchParams }: Props) {
  const { topic } = await params;
  const t = TOPIC_BY_SLUG[topic];
  if (!t) notFound();
  const sp = await searchParams;
  const orderNumber = cleanOrderNumber(Array.isArray(sp.order) ? sp.order[0] : sp.order);
  const others = TOPICS.filter((x) => x.slug !== t.slug);

  return (
    <div className="hc">
      <section className="hc-hero">
        <div className="hc-crumbs" style={{ color: "rgba(250,249,246,0.8)" }}>
          <Link href="/help" style={{ color: "var(--color-cream)" }}>Help Center</Link> / {t.title}
        </div>
        <h1>{t.title}</h1>
        <p style={{ marginBottom: 0 }}>{t.blurb}</p>
      </section>

      <div className="hc-wrap">
        <section className="hc-sec">
          <h2 className="hc-h2">{t.faqs.length} questions</h2>
          <p className="hc-hint" data-on="true">Hover over a question to preview the answer · click to keep it open</p>
          <FaqList items={t.faqs} />
        </section>

        <section className="hc-sec">
          <h2 className="hc-h2">Still need help? Talk to us</h2>
          <ContactCards orderNumber={orderNumber} subject={t.title} />
        </section>

        <section className="hc-sec">
          <h2 className="hc-h2">Other topics</h2>
          <div className="hc-topics">
            {others.map((o) => (
              <Link key={o.slug} className="hc-topic" href={`/help/${o.slug}${orderNumber ? `?order=${orderNumber}` : ""}`}>
                <span className="ic"><Icon name={o.icon} /></span>
                <div><b>{o.title}</b><span>{o.blurb}</span></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
