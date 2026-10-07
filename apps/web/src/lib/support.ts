/**
 * Help Center content + contact options. One place for the FAQ (so the hub, topic pages and search agree) and for
 * how customers reach us (WhatsApp / email / contact form). The numbers in the answers come from the same constants
 * the checkout and order rules use, so the help text can't drift from what the site actually does.
 */
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, COD_FEE, COD_MAX_LIMIT } from "@/lib/constants";
import { CANCEL_WINDOW_DAYS, RETURN_WINDOW_DAYS } from "@/lib/order-lifecycle";

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

// ── How to reach us ─────────────────────────────────────────────────────────────

export interface SupportConfig { whatsapp: string; email: string; hours: string; /** Optional phone line (digits incl. country code); empty = no "Call us" option */ phone: string }

/** The three public settings, read with literal property names so Next inlines them into the client bundle too
 *  (reading `process.env` as a whole object works on the server only and would make server and browser disagree). */
const publicEnv = () => ({
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  NEXT_PUBLIC_SUPPORT_HOURS: process.env.NEXT_PUBLIC_SUPPORT_HOURS,
  NEXT_PUBLIC_SUPPORT_PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE,
});

export function supportConfig(env: Record<string, string | undefined> = publicEnv()): SupportConfig {
  const digits = (env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  return {
    whatsapp: /^\d{10,15}$/.test(digits) ? digits : "919999999999",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "") ? (env.NEXT_PUBLIC_SUPPORT_EMAIL as string) : "support@cultraven.com",
    hours: (env.NEXT_PUBLIC_SUPPORT_HOURS ?? "").trim().slice(0, 80) || "Mon–Sat, 10 AM – 7 PM IST",
    phone: /^\d{10,15}$/.test((env.NEXT_PUBLIC_SUPPORT_PHONE ?? "").replace(/\D/g, "")) ? (env.NEXT_PUBLIC_SUPPORT_PHONE as string).replace(/\D/g, "") : "",
  };
}

/** wa.me link with a pre-filled message (WhatsApp caps long prefills, so keep it short). */
export function whatsappLink(message: string, cfg: SupportConfig = supportConfig()): string {
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(message.slice(0, 500))}`;
}

export function mailtoLink(subject: string, body = "", cfg: SupportConfig = supportConfig()): string {
  const q = [`subject=${encodeURIComponent(subject.slice(0, 150))}`, body ? `body=${encodeURIComponent(body.slice(0, 1000))}` : ""].filter(Boolean).join("&");
  return `mailto:${cfg.email}?${q}`;
}

/** Link to the contact form with the subject / order pre-filled. */
export function contactLink(opts: { subject?: string; order?: string } = {}): string {
  const q = new URLSearchParams();
  if (opts.subject) q.set("subject", opts.subject);
  if (opts.order) q.set("order", opts.order);
  const s = q.toString();
  return `/pages/contact${s ? `?${s}` : ""}`;
}

/** Order numbers look like CR-1A2B3C. Anything else is ignored so a crafted ?order= can't inject text into messages. */
export function cleanOrderNumber(v: string | null | undefined): string | null {
  const m = /^CR-[0-9A-F]{6}$/i.exec((v ?? "").trim());
  return m ? m[0].toUpperCase() : null;
}

// ── FAQ ─────────────────────────────────────────────────────────────────────────

export interface Faq { q: string; a: string }
export interface Topic { slug: string; title: string; blurb: string; icon: string; faqs: Faq[] }

export const CONTACT_SUBJECTS = ["Order inquiry", "Cancel / change an order", "Return / exchange", "Shipping issue", "Payment / refund", "Product question", "Account help", "Feedback", "Other"] as const;

export const TOPICS: Topic[] = [
  {
    slug: "orders-delivery",
    title: "Orders & delivery",
    blurb: "Tracking, delivery time, address changes",
    icon: "box",
    faqs: [
      { q: "How do I track my order?", a: "Open Account → Orders and tap Track & details on your order. You'll see each stage — Order placed, Confirmed, Packed, Shipped, Out for delivery, Delivered — with times, plus the courier name and tracking number once it ships. We also email you at every step." },
      { q: "How long does delivery take?", a: "Standard delivery takes 4–6 business days after your order ships. Orders are usually packed within 1–2 business days. Remote pincodes can take a little longer." },
      { q: "What are the shipping charges?", a: `Shipping is free on orders of ${inr(FREE_SHIPPING_THRESHOLD)} and above. Below that, a flat ${inr(SHIPPING_FEE)} applies. The exact amount is shown before you place the order.` },
      { q: "I didn't get an order confirmation email.", a: "Check your spam or promotions folder first. Your order is always saved — open Account → Orders to see it, and you can download the receipt from there. If you still can't find it, message us on WhatsApp with your registered email." },
      { q: "Can I change my delivery address?", a: "You can change the address before the order is packed. Message us on WhatsApp straight away with your order number and the new address — once it has shipped the courier can't be redirected." },
      { q: "The courier couldn't deliver my order. What now?", a: "The courier usually tries again the next working day. Keep your phone reachable, or tell us a better time on WhatsApp. After repeated failed attempts the order returns to us and any online payment is refunded." },
      { q: "My order is delayed.", a: "Check Track & details for the latest status and the courier's tracking link. If it's more than 2 days beyond the estimate, contact us with your order number and we'll chase the courier for you." },
    ],
  },
  {
    slug: "cancellation",
    title: "Cancel an order",
    blurb: "Cancel before or after it ships",
    icon: "x",
    faqs: [
      { q: "Can I cancel my order?", a: `Yes — within ${CANCEL_WINDOW_DAYS} days of placing it. Before it ships, open the order and tap Cancel order: it's cancelled instantly. Once it has shipped, tap Request cancellation and we'll ask the courier to stop it and confirm by email.` },
      { q: "How do I cancel?", a: "Account → Orders → open the order → Cancel order (or Request cancellation if it has shipped). Choose a reason and confirm. You'll get an email straight away." },
      { q: "I don't see a Cancel button.", a: `The button appears only while the order can be cancelled: within ${CANCEL_WINDOW_DAYS} days of ordering and before it's delivered. For a delivered order, use Return instead. If you think the button should be there, contact us with your order number.` },
      { q: "When will I get my money back after cancelling?", a: "Cash on Delivery orders have nothing to refund because nothing was charged. For online payments the refund goes to your original payment method within 5–7 business days." },
      { q: "Can I cancel just one item from my order?", a: "Cancellation applies to the whole order. If you only want to drop one item, cancel the order and place a new one for the items you want — or contact us and we'll try to help before it ships." },
    ],
  },
  {
    slug: "returns",
    title: "Returns & exchanges",
    blurb: `${RETURN_WINDOW_DAYS}-day easy returns, size exchanges`,
    icon: "refresh",
    faqs: [
      { q: "What is your return policy?", a: `You can return an order within ${RETURN_WINDOW_DAYS} days of delivery. Items must be unworn, unwashed, and have the original tags. Sale items follow the same policy unless the product page says otherwise.` },
      { q: "How do I request a return?", a: "Account → Orders → open the delivered order → Return / exchange. Choose a reason, add a note, and submit. We review it and email you; once approved we arrange the pickup and refund." },
      { q: "How do I exchange for a different size?", a: `Contact us within ${RETURN_WINDOW_DAYS} days of delivery with your order number and the size you want. If it's in stock we'll swap it; otherwise you can return the item for a refund.` },
      { q: "I received a damaged or wrong item.", a: "We're sorry! Raise a return right away from the order page, choose Received damaged or Wrong item received, and include a photo on WhatsApp so we can fast-track a replacement or refund." },
      { q: "When do I get my refund for a return?", a: "After the returned item reaches us and passes a quick check, the refund is issued to your original payment method within 5–7 business days. For Cash on Delivery orders we'll ask for your UPI ID or bank details." },
      { q: "Can I return a sale or limited-edition item?", a: "Yes, unless the product page says it's final sale. Limited-edition items follow the same 7-day window." },
    ],
  },
  {
    slug: "payments-refunds",
    title: "Payments & refunds",
    blurb: "COD, online payment, coupons, refunds",
    icon: "card",
    faqs: [
      { q: "Which payment methods do you accept?", a: `Cash on Delivery is available now (a ${inr(COD_FEE)} handling fee applies, for orders up to ${inr(COD_MAX_LIMIT)}). Online payment by UPI, cards and netbanking via Razorpay is being switched on — you'll see it as an option at checkout as soon as it's live.` },
      { q: "Is Cash on Delivery available everywhere?", a: `COD is available on orders up to ${inr(COD_MAX_LIMIT)}. If your order is above that, or COD isn't offered for your pincode, you'll see it greyed out at checkout.` },
      { q: "My payment failed but money was deducted.", a: "Don't worry — failed payments are automatically reversed to your account within 5–7 business days. If it hasn't come back after that, share the payment ID with us and we'll trace it." },
      { q: "How do coupon codes work?", a: "Enter your code in the cart. One code can be used per order, and some codes need a minimum order value — the cart tells you exactly why a code can't be applied." },
      { q: "How long do refunds take?", a: "Refunds go to your original payment method within 5–7 business days of the cancellation or return being approved. Your bank may take a couple of extra days to show it." },
      { q: "Will I get a receipt?", a: "Yes. A PDF receipt is attached to your order confirmation email, and you can download it any time from Account → Orders → your order → Download receipt." },
    ],
  },
  {
    slug: "account",
    title: "Account & profile",
    blurb: "Sign-in, addresses, profile photo, privacy",
    icon: "user",
    faqs: [
      { q: "I forgot my password.", a: "On the sign-in page tap Forgot password and enter your email. We'll send you a link to set a new one. If the email doesn't arrive, check spam, or contact us." },
      { q: "How do I add or change an address?", a: "Account → Addresses. You can add up to 10 addresses, edit them, and set a default that's pre-selected at checkout. You can also use your current location to fill an address." },
      { q: "How do I change my name, phone or photo?", a: "Account → Profile. You can update your name and phone, change your password, and upload a profile photo." },
      { q: "How do I delete my account?", a: "Account → Profile → Delete my account. You'll confirm with your password. Your sign-in is removed immediately; we keep past order records only as long as the law requires for accounting and returns." },
      { q: "Do I need an account to order?", a: "Yes — signing in lets us save your addresses, show live order tracking, and let you cancel or return in a couple of taps." },
    ],
  },
  {
    slug: "products-sizing",
    title: "Products & sizing",
    blurb: "Fit, size guide, care, stock",
    icon: "ruler",
    faqs: [
      { q: "How should I size CULTRAVEN pieces?", a: "Our tees and hoodies are an oversized fit. For a standard oversized look, go one size down from your usual; keep your usual size for the extra-baggy drop-shoulder look. The Size Guide has exact chest, length and shoulder measurements." },
      { q: "Where can I find the size guide?", a: "On every product page next to the size selector, or on the Size Guide page in the footer." },
      { q: "How do I wash and care for my pieces?", a: "Cold wash, inside out, with similar colours. Don't bleach, avoid tumble drying, and iron on low heat on the reverse side of prints. This keeps graphics and fabric looking fresh." },
      { q: "An item shows Sold out. Will it be restocked?", a: "Some items are limited editions and won't return. Follow us on Instagram or check back on the product page — if it's restocked, the Sold out label disappears." },
      { q: "Are the product photos accurate?", a: "We photograph in natural light, but screens vary a little. If a colour looks different in person, the 7-day return policy has you covered." },
    ],
  },
];

export const TOPIC_BY_SLUG: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));

/** Questions shown first on the hub. */
export const POPULAR: { topic: string; q: string }[] = [
  { topic: "orders-delivery", q: "How do I track my order?" },
  { topic: "cancellation", q: "Can I cancel my order?" },
  { topic: "returns", q: "What is your return policy?" },
  { topic: "payments-refunds", q: "How long do refunds take?" },
  { topic: "orders-delivery", q: "How long does delivery take?" },
  { topic: "payments-refunds", q: "Which payment methods do you accept?" },
  { topic: "returns", q: "How do I exchange for a different size?" },
  { topic: "account", q: "I forgot my password." },
];

export interface SearchHit { topic: Topic; faq: Faq; score: number }

/** Simple keyword search across every question and answer; questions weigh more than answers. */
export function searchFaqs(query: string, topics: Topic[] = TOPICS, limit = 12): SearchHit[] {
  const words = query.toLowerCase().replace(/[^a-z0-9₹\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const hits: SearchHit[] = [];
  for (const topic of topics) {
    for (const faq of topic.faqs) {
      const q = faq.q.toLowerCase(), a = faq.a.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (q.includes(w)) score += 3;
        if (a.includes(w)) score += 1;
      }
      // every word must appear somewhere, so "cancel refund" doesn't match unrelated answers
      if (words.every((w) => q.includes(w) || a.includes(w)) && score > 0) hits.push({ topic, faq, score });
    }
  }
  return hits.sort((x, y) => y.score - x.score).slice(0, limit);
}

/** Map free text (a topic title or a ?subject= value) onto one of the contact form's subjects, or "" when nothing fits. */
export function matchSubject(raw: string | null | undefined): string {
  const t = (raw ?? "").toLowerCase().trim();
  if (!t) return "";
  const exact = CONTACT_SUBJECTS.find((x) => x.toLowerCase() === t);
  if (exact) return exact;
  if (/cancel/.test(t)) return "Cancel / change an order";
  if (/return|exchange/.test(t)) return "Return / exchange";
  if (/refund|payment|coupon|cod/.test(t)) return "Payment / refund";
  if (/ship|deliver|track/.test(t)) return "Shipping issue";
  if (/size|product|fit|stock/.test(t)) return "Product question";
  if (/account|profile|password|address/.test(t)) return "Account help";
  if (/order/.test(t)) return "Order inquiry";
  return "";
}

/** tel: link for the optional phone line ("" when no phone is configured). */
export function telLink(cfg: SupportConfig = supportConfig()): string {
  return cfg.phone ? `tel:+${cfg.phone}` : "";
}

/** Pretty "+91 98450 73921" style display for a digits-only number. */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return d ? `+${d}` : "";
}
