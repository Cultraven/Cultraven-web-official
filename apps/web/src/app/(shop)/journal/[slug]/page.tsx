import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "@/components/common/CmsImage";
import { getCmsSection } from "@/lib/cms/server";
import { liveItems } from "@/lib/cms/registry";

export const dynamic = "force-dynamic";

async function findArticle(slug: string) {
  const section = await getCmsSection<any>("page.journal");
  return liveItems<any>(section.data?.items).find((a) => a.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await findArticle(slug);
  return a ? { title: `${a.title} | CULTRAVEN Journal`, description: a.excerpt } : { title: "Journal | CULTRAVEN" };
}

/** Journal article — title, image, excerpt and optional body, all from the page.journal CMS section. */
export default async function JournalArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await findArticle(slug);
  if (!a) notFound();
  const paragraphs = String(a.body ?? "").split(/\n{2,}/).map((p: string) => p.trim()).filter(Boolean);

  return (
    <article style={{ backgroundColor: "var(--color-cream)", minHeight: "60dvh", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "2.5rem clamp(1.25rem,4vw,2rem) 0" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-crimson)" }}>
          {a.category}{a.date ? ` · ${a.date}` : ""}
        </span>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 600, color: "var(--color-navy)", lineHeight: 1.1, margin: "0.75rem 0 1.5rem", overflowWrap: "anywhere" }}>{a.title}</h1>
        {a.image ? (
          <div style={{ position: "relative", aspectRatio: "16/10", backgroundColor: "var(--color-mist)", border: "var(--border-thick)", marginBottom: "2rem" }}>
            <Image src={a.image} alt={a.title} fill priority sizes="(max-width: 860px) 100vw, 820px" style={{ objectFit: "cover" }} />
          </div>
        ) : null}
        {a.excerpt ? <p style={{ fontFamily: "var(--font-sans)", fontSize: "1.05rem", lineHeight: 1.7, fontWeight: 600, color: "var(--color-navy)", marginBottom: "1.25rem" }}>{a.excerpt}</p> : null}
        {paragraphs.map((p: string, i: number) => (
          <p key={i} style={{ fontFamily: "var(--font-sans)", fontSize: "0.95rem", lineHeight: 1.8, color: "var(--color-navy)", marginBottom: "1.1rem" }}>{p}</p>
        ))}
        <Link href="/pages/journal" className="cv-btn" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", marginTop: "1.5rem", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-navy)", textDecoration: "none", borderBottom: "2px solid var(--color-lava)" }}>
          ← All stories
        </Link>
      </div>
    </article>
  );
}
