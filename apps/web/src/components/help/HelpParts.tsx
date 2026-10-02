"use client";
/** Shared Help Center pieces: FAQ list, contact cards (WhatsApp / email / call / form), and the order-aware help panel. */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/styles/help.css";
import { CONTACT_SUBJECTS, contactLink, formatPhone, mailtoLink, supportConfig, telLink, whatsappLink, type Topic } from "@/lib/support";
import { STATUS_LABEL, isOrderStatus } from "@/lib/order-lifecycle";
import { FaqAccordion, type FaqItem } from "./FaqAccordion";

const Ic = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d={d} /></svg>
);
export const ICONS: Record<string, string> = {
  box: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  x: "M18 6L6 18M6 6l12 12",
  refresh: "M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M3 21v-5h5M21 3v5h-5",
  card: "M2 6h20v12H2zM2 10h20M6 15h4",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  ruler: "M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  form: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  faq: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 18h.01M3 3h18v18H3z",
};
export const Icon = ({ name }: { name: string }) => <Ic d={ICONS[name] ?? ICONS.chat} />;

/** Question list: hover to preview, click to keep open (see FaqAccordion). */
export function FaqList({ items, from, hover = true, forceOpen = false }: { items: (FaqItem & { topic?: Topic })[]; from?: boolean; hover?: boolean; forceOpen?: boolean }) {
  return <FaqAccordion items={items} from={from} hover={hover} forceOpen={forceOpen} />;
}

/** Every way to reach us. Each card is a real link with the order number / issue pre-filled. */
export function ContactCards({ orderNumber, subject, waMessage }: { orderNumber?: string | null; subject?: string; waMessage?: string }) {
  const cfg = supportConfig();
  const ctx = orderNumber ? ` for order ${orderNumber}` : "";
  const topic = subject ?? "";
  const waMsg = waMessage ?? `Hi CULTRAVEN, I need help${topic ? ` with: ${topic}` : ""}${ctx}.`;
  const mailSub = `${topic || "Help"}${orderNumber ? ` — ${orderNumber}` : ""}`;
  const tel = telLink(cfg);
  return (
    <>
      <div className="hc-contact" data-count={tel ? 5 : 4}>
        <a className="hc-card wa" href={whatsappLink(waMsg, cfg)} target="_blank" rel="noopener noreferrer">
          <span className="ic"><Icon name="chat" /></span><b>Chat on WhatsApp</b><span>Fastest way to reach us. We reply during support hours.</span><em>Open WhatsApp →</em>
        </a>
        <a className="hc-card" href={mailtoLink(mailSub, `Hi CULTRAVEN,\n\n${orderNumber ? `Order: ${orderNumber}\n` : ""}`, cfg)}>
          <span className="ic"><Icon name="mail" /></span><b>Email us</b><span>{cfg.email}<br />We reply within 24 hours.</span><em>Write an email →</em>
        </a>
        {tel ? (
          <a className="hc-card" href={tel}>
            <span className="ic"><Icon name="phone" /></span><b>Call us</b><span>{formatPhone(cfg.phone)}<br />{cfg.hours}</span><em>Call now →</em>
          </a>
        ) : null}
        <Link className="hc-card" href={contactLink({ subject: topic || undefined, order: orderNumber ?? undefined })}>
          <span className="ic"><Icon name="form" /></span><b>Contact us</b><span>Send a message from the site and get a reference number.</span><em>Open the form →</em>
        </Link>
        <Link className="hc-card" href="/help/faq">
          <span className="ic"><Icon name="faq" /></span><b>Browse FAQs</b><span>Quick answers on orders, returns, payments and sizing.</span><em>See all questions →</em>
        </Link>
      </div>
      <p className="hc-hours">Support hours: {cfg.hours}. Messages sent outside these hours are answered the next working day.</p>
    </>
  );
}

interface OrderLite { id: string; number: string; status: string; canCancel: { ok: boolean; mode?: string }; canReturn: { ok: boolean } }
interface Issue { key: string; label: string; subject: string; wa: string }

/** The issues that need a conversation. Clicking one reveals every contact option with that issue pre-filled. */
export const ORDER_ISSUES: { key: string; label: string; subject: string; wa: string }[] = [
  { key: "address", label: "Change address", subject: "Cancel / change an order", wa: "I want to change my delivery address" },
  { key: "damaged", label: "Damaged / wrong item", subject: "Return / exchange", wa: "my item arrived damaged / wrong" },
  { key: "payment", label: "Payment / refund", subject: "Payment / refund", wa: "I have a payment or refund question" },
  { key: "other", label: "Other issue", subject: "Order inquiry", wa: "I have a question" },
];

/** "Help with order CR-XXXXXX": status, quick actions, and issue buttons that open the contact options below. */
export function OrderHelp({ orderId, orderNumber }: { orderId: string; orderNumber: string | null }) {
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  const [issue, setIssue] = useState<Issue | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch(`/api/orders/${orderId}?view=customer`, { cache: "no-store", signal: ac.signal })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => { setOrder(d.order); setState("ok"); })
      .catch((e) => e.name !== "AbortError" && setState("none"));
    return () => ac.abort();
  }, [orderId]);

  // Bring the contact options into view when an issue is chosen.
  useEffect(() => {
    if (issue) panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [issue]);

  const cfg = supportConfig();
  const num = order?.number ?? orderNumber;
  if (state === "loading") return <div className="hc-order"><div className="skel" style={{ height: 70 }} /></div>;
  if (state === "none" || !order) {
    return (
      <div className="hc-order">
        <h2>Help with an order{num ? ` ${num}` : ""}</h2>
        <small>Sign in to see this order&apos;s status and quick actions.</small>
        <div className="hc-chips"><Link className="hc-chip" href={`/login?redirect=${encodeURIComponent(`/help?order=${orderId}`)}`}>Sign in</Link><a className="hc-chip" href={whatsappLink(`Hi CULTRAVEN, I need help${num ? ` with order ${num}` : ""}.`, cfg)} target="_blank" rel="noopener noreferrer">WhatsApp us</a></div>
      </div>
    );
  }
  const label = isOrderStatus(order.status) ? STATUS_LABEL[order.status] : order.status;
  return (
    <div className="hc-order">
      <h2>Help with order {order.number}</h2>
      <small>Current status: <b>{label}</b></small>
      <div className="hc-chips">
        <Link className="hc-chip" href={`/account/orders/${order.id}`}>Track order</Link>
        {order.canCancel.ok ? <Link className="hc-chip" href={`/account/orders/${order.id}?action=cancel`}>{order.canCancel.mode === "request" ? "Request cancellation" : "Cancel order"}</Link> : null}
        {order.canReturn.ok ? <Link className="hc-chip" href={`/account/orders/${order.id}?action=return`}>Return / exchange</Link> : null}
        <a className="hc-chip" href={`/api/orders/${order.id}/invoice`}>Download receipt</a>
        {ORDER_ISSUES.map((i) => (
          <button key={i.key} type="button" className="hc-chip" aria-pressed={issue?.key === i.key} aria-controls="hc-issue-panel" data-issue={i.key} onClick={() => setIssue(issue?.key === i.key ? null : i)}>
            {i.label}
          </button>
        ))}
      </div>

      {issue ? (
        <div id="hc-issue-panel" ref={panelRef} className="hc-issue" role="region" aria-label={`Contact options for ${issue.label}`}>
          <div className="hc-issue-head">
            <h3>How would you like to reach us about “{issue.label}”?</h3>
            <button type="button" className="hc-x" onClick={() => setIssue(null)} aria-label="Close contact options">×</button>
          </div>
          <ContactCards orderNumber={order.number} subject={issue.subject} waMessage={`Hi CULTRAVEN, ${issue.wa} (order ${order.number}).`} />
        </div>
      ) : null}
    </div>
  );
}

export { CONTACT_SUBJECTS };
