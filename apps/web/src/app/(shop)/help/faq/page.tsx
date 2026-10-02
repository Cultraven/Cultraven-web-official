import type { Metadata } from "next";
import AllFaqs from "./AllFaqs";

export const metadata: Metadata = {
  title: "All questions — Help Center",
  description: "Every CULTRAVEN FAQ in one place: orders, delivery, cancellation, returns, payments, account and sizing.",
  alternates: { canonical: "/help/faq" },
};

interface Props { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

/** /help/faq — every question, grouped by topic, searchable. ?faq=click turns hover-preview off. */
export default async function AllFaqsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const variant = Array.isArray(sp.faq) ? sp.faq[0] : sp.faq;
  return <AllFaqs hover={variant !== "click"} />;
}
