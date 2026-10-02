import type { Metadata } from "next";
import HelpCenter from "./HelpCenter";
import { cleanOrderNumber } from "@/lib/support";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers about orders, delivery, cancellations, returns and payments — or chat with us on WhatsApp.",
  alternates: { canonical: "/help" },
};

interface Props { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }

/** /help — optionally /help?order=<orderId> to show help for one of the customer's orders. */
export default async function HelpPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.order) ? sp.order[0] : sp.order;
  const orderId = /^[a-f0-9]{24}$/i.test(raw ?? "") ? (raw as string) : null;
  const variant = Array.isArray(sp.faq) ? sp.faq[0] : sp.faq; // ?faq=click -> click-only accordions (A/B comparison / accessibility preference)
  return <HelpCenter orderId={orderId} orderNumber={orderId ? `CR-${orderId.slice(-6).toUpperCase()}` : cleanOrderNumber(raw)} hover={variant !== "click"} />;
}
