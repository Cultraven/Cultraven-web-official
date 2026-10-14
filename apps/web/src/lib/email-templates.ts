/** Order emails (customer confirmation + admin alert). Pure functions: HTML is table-based with inline CSS, text fallback included. */

import { BUSINESS, businessAddress } from "@/lib/business";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { RETURN_WINDOW_DAYS, STATUS_LABEL, isOrderStatus, buildTimeline, type TimelineStep } from "@/lib/order-lifecycle";
import { supportConfig, formatPhone, whatsappLink } from "@/lib/support";
import { maskEmail } from "@/lib/mask-email";

export interface MailOrder {
  id: string;
  createdAt: Date | string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: string;
  items: { title: string; size: string; color?: string; quantity: number; pricePaise: number; image?: string }[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  totalPaise: number;
  deliveryAddress: { name: string; email?: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
}

export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
export const orderNumber = (id: string) => `CR-${id.slice(-6).toUpperCase()}`;

const NAVY = "#172554", GOLD = "#DAB205", CREAM = "#FAF9F6", BONE = "#EDE3CF", MUTED = "#555555", RED = "#B3261E", RULE = "#D5D0C2";
const WRAP = "word-break:break-word;overflow-wrap:anywhere";
/** Markup -> plain text for the inbox preview. Inline tags vanish ("<b>IST</b>." stays "IST."); block tags become a space. */
/** One line of plain text: line breaks and runs of spaces become a single space. */
const oneLine = (s: string) => String(s ?? "").replace(/[\r\n\u0085\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
const stripTags = (h: string) => h.replace(/<\/?(?:b|i|u|strong|em|span|a|code)\b[^>]*>/gi, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// ── Dates (always India time — that is what the customer's clock says) ─────────────

function istParts(d: Date | string | number): Record<string, string> | null {
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(t)) p[x.type] = x.value;
  return p;
}
/** "Tue, 14 Oct 2026" */
export const istDate = (d: Date | string | number) => { const p = istParts(d); return p ? `${p.weekday}, ${p.day} ${p.month} ${p.year}` : ""; };
/** "Tue, 14 Oct 2026, 3:42 pm IST" */
export const istDateTime = (d: Date | string | number) => { const p = istParts(d); return p ? `${p.weekday}, ${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${p.dayPeriod.toLowerCase()} IST` : ""; };
/** "14 Oct, 3:42 pm" — the compact form used in the tracker */
const istShort = (d: Date | string | number) => { const p = istParts(d); return p ? `${p.day} ${p.month}, ${p.hour}:${p.minute} ${p.dayPeriod.toLowerCase()}` : ""; };

/** Delivery window: 3 to 5 days after the order, not counting Sundays. */
export function estimatedDelivery(placed: Date | string): { from: Date; to: Date } | null {
  const start = new Date(placed).getTime();
  if (Number.isNaN(start)) return null;
  const after = (days: number) => {
    let t = start, left = days;
    while (left > 0) { t += 86_400_000; if (istParts(t)?.weekday !== "Sun") left--; }
    return new Date(t);
  };
  return { from: after(3), to: after(5) };
}
const etaShort = (d: Date) => { const p = istParts(d)!; return `${p.weekday}, ${p.day} ${p.month}`; };
const etaText = (placed: Date | string) => { const e = estimatedDelivery(placed); return e ? `${etaShort(e.from)} – ${etaShort(e.to)} (3–5 business days)` : "3–5 business days"; };

// ── Contact details as real, tidy links (mail apps would otherwise paint their own blue ones) ─────

const LINK = `color:${NAVY};text-decoration:underline`;
/** Only plain, boring addresses become mailto: links. Characters like ? & % could otherwise add a Bcc or other header when the link is clicked. */
const looksLikeEmail = (e: string) => /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(e);
const mailLink = (e?: string) => (e && looksLikeEmail(e) ? `<a href="mailto:${escapeHtml(e)}" style="${LINK}">${escapeHtml(e)}</a>` : escapeHtml(e || "—"));
/** Indian mobile numbers become tap-to-call "+91 98450 73921" links; anything else stays plain text. */
function phoneDigits(p?: string): string {
  const d = String(p ?? "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return "";
}
const telLink = (p?: string) => { const d = phoneDigits(p); return d ? `<a href="tel:+${d}" style="${LINK}">${escapeHtml(formatPhone(d))}</a>` : escapeHtml(p || "—"); };

function addressLines(a: MailOrder["deliveryAddress"]): string[] {
  return [a.name, a.line1, a.line2 ?? "", `${a.city}, ${a.state} ${a.pincode}`, `Phone: ${a.phone}`].filter(Boolean);
}
const addressHtml = (a: MailOrder["deliveryAddress"]) =>
  `<p style="margin:0;font-size:14px;line-height:1.6"><b>${escapeHtml(a.name)}</b><br>${[a.line1, a.line2 ?? "", `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).map(escapeHtml).join("<br>")}<br>${telLink(a.phone)}</p>`;

function totalsRows(o: MailOrder): [string, string][] {
  const rows: [string, string][] = [["Subtotal", inr(o.subtotalPaise)]];
  if (o.discountPaise > 0) rows.push(["Discount", `−${inr(o.discountPaise)}`]);
  rows.push(["Shipping", o.shippingPaise === 0 ? "FREE" : inr(o.shippingPaise)]);
  if (o.codFeePaise > 0) rows.push(["COD fee", inr(o.codFeePaise)]);
  return rows;
}

function payLine(o: MailOrder): string {
  return o.paymentMethod === "cod" ? `Cash on Delivery — pay ${inr(o.totalPaise)} when it arrives` : o.paymentStatus === "paid" ? "Paid online" : "Online payment (pending confirmation)";
}

// ── Building blocks ───────────────────────────────────────────────────────────────

const h2 = (t: string) => `<p style="margin:24px 0 8px;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:${NAVY}">${t}</p>`;
const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:${NAVY};color:${CREAM};padding:14px 24px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">${label}</a>`;
const callout = (inner: string, color = GOLD) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;background:${BONE};padding:10px 12px;border-left:4px solid ${color}">${inner}</p>`;

/** Label / value rows — the same layout Amazon and Flipkart use for "Order #, Placed on, Payment…". */
function details(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;border-top:1px solid ${BONE}">${rows
    .map(([k, v]) => `<tr><td width="112" valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${BONE};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${MUTED}">${k}</td><td valign="top" style="padding:9px 0;border-bottom:1px solid ${BONE};font-size:14px;line-height:1.5;${WRAP}">${v}</td></tr>`)
    .join("")}</table>`;
}

const imageUrl = (src: string | undefined, siteUrl: string) => {
  const s = String(src ?? "").trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") && !s.startsWith("//") ? `${siteUrl.replace(/\/$/, "")}${s}` : "";
};

function itemsTable(o: MailOrder, siteUrl: string): string {
  const withImage = o.items.some((i) => imageUrl(i.image, siteUrl));
  const span = withImage ? 2 : 1; // totals rows start under the product column(s)
  const rowStyle = `border-bottom:1px solid ${BONE}`;
  const items = o.items.map((i) => {
    const src = imageUrl(i.image, siteUrl);
    const thumb = withImage
      ? `<td width="72" valign="top" style="padding:12px 12px 12px 0;${rowStyle}">${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(i.title)}" width="60" height="60" style="display:block;width:60px;height:60px;object-fit:cover;border:1px solid ${BONE}">` : ""}</td>`
      : "";
    const variant = [i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" · ");
    return `<tr>${thumb}<td valign="top" style="padding:12px 0;${rowStyle};font-size:14px;line-height:1.4"><b>${escapeHtml(i.title)}</b><br><span style="color:${MUTED};font-size:12px">${escapeHtml(variant)}${variant ? " · " : ""}Qty ${i.quantity}${i.quantity > 1 ? ` · ${inr(i.pricePaise)} each` : ""}</span></td><td align="right" valign="top" style="padding:12px 0 12px 12px;${rowStyle};font-size:14px;white-space:nowrap;word-break:normal">${inr(i.pricePaise * i.quantity)}</td></tr>`;
  }).join("");
  const totals = totalsRows(o)
    .map(([k, v]) => `<tr><td colspan="${span}" style="padding:4px 0;font-size:13px;color:${MUTED}">${k}</td><td align="right" style="padding:4px 0 4px 12px;font-size:13px;white-space:nowrap;word-break:normal">${v}</td></tr>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:6px">${items}${totals}<tr><td colspan="${span}" style="padding:10px 0;font-size:16px;font-weight:900;border-top:2px solid ${NAVY}">TOTAL</td><td align="right" style="padding:10px 0 10px 12px;font-size:16px;font-weight:900;border-top:2px solid ${NAVY};white-space:nowrap;word-break:normal">${inr(o.totalPaise)}</td></tr><tr><td colspan="${span + 1}" style="padding:0 0 4px;font-size:12px;color:${MUTED}">Inclusive of all applicable taxes</td></tr></table>`;
}

// ── The vertical order tracker ────────────────────────────────────────────────────

/**
 * Steps as shown in an email: once an order is cancelled / returned the steps it never reached are dropped, and an "on hold" or
 * "delivery failed" step sits right after the last step that happened (not after the ones still to come).
 */
function emailSteps(steps: TimelineStep[]): TimelineStep[] {
  if (steps.some((s) => s.state === "bad")) return steps.filter((s) => s.state !== "todo");
  const last = steps[steps.length - 1];
  if (last && (last.key === "on_hold" || last.key === "delivery_failed")) {
    const rest = steps.slice(0, -1);
    const lastDone = rest.map((s) => s.state).lastIndexOf("done");
    return [...rest.slice(0, lastDone + 1), last, ...rest.slice(lastDone + 1)];
  }
  return steps;
}

/**
 * A vertical tracker: a dot per step on a line — ✓ done, gold ring = where the order is now, hollow = still to come, red ✕ = stopped.
 * Built from a bordered cell with the dot pulled onto the line, which every major mail app renders (Outlook for Windows
 * keeps the line and shows the dot just beside it).
 */
function tracker(allSteps: TimelineStep[]): string {
  const steps = emailSteps(allSteps);
  const rows = steps.map((s, i) => {
    const next = steps[i + 1];
    const line = !next ? CREAM : s.state === "done" && next.state !== "todo" ? NAVY : RULE;
    const dot = s.state === "done" ? { bg: NAVY, bd: NAVY, glyph: "&#10003;", fg: "#ffffff" }
      : s.state === "current" ? { bg: GOLD, bd: NAVY, glyph: "", fg: NAVY }
      : s.state === "bad" ? { bg: RED, bd: RED, glyph: "&#10005;", fg: "#ffffff" }
      : { bg: "#ffffff", bd: "#C9C3B3", glyph: "", fg: "#ffffff" };
    const labelColor = s.state === "bad" ? RED : s.state === "todo" ? "#8A8678" : NAVY;
    const when = s.at ? istShort(s.at) : "";
    const sub = s.state === "current" ? `Current status${when ? ` · ${when}` : ""}` : s.state === "todo" ? "" : when;
    return `<tr><td style="padding:0 0 0 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-left:2px solid ${line};padding:0 0 ${next ? 20 : 0}px 26px;${WRAP}"><span style="display:inline-block;box-sizing:border-box;width:18px;height:18px;line-height:14px;border-radius:50%;background:${dot.bg};border:2px solid ${dot.bd};text-align:center;font-size:12px;font-weight:900;color:${dot.fg};margin:0 18px 0 -36px;vertical-align:middle">${dot.glyph}</span><span style="font-size:15px;font-weight:${s.state === "todo" ? 400 : 700};color:${labelColor};vertical-align:middle">${escapeHtml(s.label)}</span>${sub ? `<div style="font-size:12px;line-height:1.5;color:${MUTED};margin-top:2px">${escapeHtml(sub)}</div>` : ""}${s.note ? `<div style="font-size:13px;line-height:1.5;color:${NAVY};margin-top:4px;font-style:italic">&ldquo;${escapeHtml(s.note)}&rdquo;</div>` : ""}</td></tr></table></td></tr>`;
  }).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">${rows}</table>`;
}

function trackerText(allSteps: TimelineStep[]): string[] {
  return emailSteps(allSteps).map((s) => `${s.state === "done" ? "[x]" : s.state === "current" ? "[>]" : s.state === "bad" ? "[!]" : "[ ]"} ${s.label}${s.at && s.state !== "todo" ? ` — ${istShort(s.at)}` : ""}${s.state === "current" ? " (now)" : ""}`);
}

// ── Header, footer, shell ─────────────────────────────────────────────────────────

type Audience = "customer" | "team" | "account" | "security";

/** "Need help?" with the support phone, WhatsApp and email — all one tap on a phone. */
function helpBlock(): string {
  const cfg = supportConfig();
  const link = (href: string, label: string) => `<a class="fl" href="${escapeHtml(href)}" style="color:${NAVY};font-weight:700;text-decoration:underline;display:inline-block;line-height:20px;padding:7px 16px 7px 0">${label}</a>`;
  return `<p style="margin:0;font-size:13px;line-height:1.6;color:${NAVY}"><b>Need help?</b> We're here ${escapeHtml(cfg.hours)}. Just reply to this email, or:</p>` +
    `<p style="margin:0 0 6px">${link(`tel:+${cfg.phone}`, `Call ${escapeHtml(formatPhone(cfg.phone))}`)}${link(whatsappLink("Hi CULTRAVEN, I need help with my order", cfg), "WhatsApp us")}${link(`mailto:${cfg.email}`, escapeHtml(cfg.email))}</p>`;
}

/** The footer: help + links, the delivery/returns promise, who we are (name, address, GSTIN) and why this email arrived. */
function footerFor(siteUrl: string, audience: Audience): string {
  const base = siteUrl.replace(/\/$/, "");
  const link = (href: string, label: string) => `<a class="fl" href="${escapeHtml(href)}" style="color:${NAVY};font-weight:700;text-decoration:underline;display:inline-block;line-height:20px;padding:7px 16px 7px 0">${label}</a>`; // 34px tall: enough to tap, without a big gap between rows on a phone
  const who = (margin: string) => `<p style="margin:${margin};font-size:12px;line-height:1.6;color:${MUTED}"><b style="color:${NAVY}">${escapeHtml(BUSINESS.sellerName)}</b> &middot; ${escapeHtml(businessAddress())}<br>GSTIN ${escapeHtml(BUSINESS.gstin)}</p>`;
  const cell = (inner: string) => `<tr><td style="padding:20px 24px;border-top:2px solid ${NAVY};background:#fff;font-size:12px;line-height:1.6;color:${MUTED};${WRAP}">${inner}</td></tr>`;
  const year = new Date().getFullYear();
  if (audience === "team") {
    return cell(
      `<p style="margin:0 0 8px;font-size:13px;color:${NAVY}"><b>Internal notification for the CULTRAVEN team.</b></p>` +
      `<p style="margin:0 0 12px">${link(`${base}/portal-secure`, "Open the admin panel")}${link(`${base}/portal-secure/settings/email`, "Choose who receives alerts")}</p>` +
      who(`12px 0 8px;padding-top:12px;border-top:1px solid ${BONE}`) +
      `<p style="margin:0;font-size:12px">&copy; ${year} ${escapeHtml(BUSINESS.brand)}</p>`,
    );
  }
  const links = audience === "customer"
    ? `<p style="margin:0 0 12px">${link(`${base}/account/orders`, "Your orders")}${link(`${base}/help`, "Help Center")}${link(`${base}/pages/returns`, "Returns")}${link(`${base}/pages/shipping`, "Shipping")}</p>` +
      `<p style="margin:0 0 14px;padding:10px 12px;background:${BONE};border-left:4px solid ${GOLD};color:${NAVY};font-size:12px"><b>Free delivery</b> above ${inr(FREE_SHIPPING_THRESHOLD)} &middot; <b>Cash on Delivery</b> available &middot; <b>${RETURN_WINDOW_DAYS}-day</b> easy returns</p>`
    : `<p style="margin:0 0 12px">${link(base, "cultraven.com")}</p>`;
  const why = audience === "customer"
    ? "You are receiving this email because of your order or account at cultraven.com."
    : audience === "security"
      ? "You are receiving this email because of a security-related action on your CULTRAVEN account."
      : "You are receiving this email because a CULTRAVEN account was created for you.";
  return cell(
    helpBlock() + links +
    who(`0 0 12px;padding-top:12px;border-top:1px solid ${BONE}`) +
    `<p style="margin:0 0 4px;font-size:12px">${why}</p><p style="margin:0;font-size:12px">&copy; ${year} ${escapeHtml(BUSINESS.brand)}. All rights reserved.</p>`,
  );
}

function shell(title: string, intro: string, body: string, siteUrl: string, audience: Audience = "customer"): string {
  const base = siteUrl.replace(/\/$/, "");
  // The line shown next to the subject in the inbox list, padded so no body text is pulled into the preview.
  const preheader = `${escapeHtml(stripTags(intro).slice(0, 110))}${"&nbsp;&zwnj;".repeat(40)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><meta name="format-detection" content="telephone=no,date=no,address=no,email=no"><style>@media (min-width:601px){.fl{padding-top:3px!important;padding-bottom:3px!important}}</style><title>${escapeHtml(title)}</title></head><body style="margin:0;background:${BONE};font-family:Arial,Helvetica,sans-serif;color:${NAVY};-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BONE};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CREAM};border:2px solid ${NAVY}">
<tr><td style="background:${NAVY};padding:20px 24px"><a href="${escapeHtml(base)}" style="text-decoration:none;color:${CREAM}"><img src="${escapeHtml(base)}/email-logo.png" width="190" height="40" alt="CULTRAVEN" style="display:block;border:0;outline:none;width:190px;max-width:100%;height:auto;font-family:Arial,Helvetica,sans-serif;color:${CREAM};font-weight:900;font-size:18px;letter-spacing:4px"></a></td></tr>
<tr><td style="height:6px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:24px;${WRAP}"><h1 style="margin:0 0 8px;font-size:22px;text-transform:uppercase">${escapeHtml(title).replace(/CR-[0-9A-F]{6}/g, (m) => `<span style="white-space:nowrap">${m}</span>`)}</h1><p style="margin:0 0 20px;font-size:14px;line-height:1.6">${intro}</p>${body}</td></tr>
${footerFor(siteUrl, audience)}
</table></td></tr></table></body></html>`;
}

/** Emails to the CULTRAVEN team (alerts), to people given an account, and security notices get footers that say so. */
const teamShell = (title: string, intro: string, body: string, siteUrl: string) => shell(title, intro, body, siteUrl, "team");
const accountShell = (title: string, intro: string, body: string, siteUrl: string) => shell(title, intro, body, siteUrl, "account");
const securityShell = (title: string, intro: string, body: string, siteUrl: string) => shell(title, intro, body, siteUrl, "security");

/** "+91 89622 12605" as plain text (for the text part) and as a tap-to-call link (for the html part). */
const supportNumber = () => formatPhone(supportConfig().phone);
const supportTel = () => `<a href="tel:+${supportConfig().phone}" style="${LINK}">${escapeHtml(supportNumber())}</a>`;

// ── Order emails ──────────────────────────────────────────────────────────────────

export function customerOrderEmail(o: MailOrder, siteUrl: string, opts: { receiptAttached?: boolean } = {}) {
  const no = orderNumber(o.id);
  const subject = `Order confirmed — ${no}`;
  const steps = buildTimeline({ fulfillmentStatus: "processing", createdAt: o.createdAt });
  const html = shell(
    "Order confirmed",
    `Hi ${escapeHtml(o.deliveryAddress.name.split(" ")[0])}, thanks for your order <b>${no}</b>. We're getting it ready.`,
    details([["Order no.", `<b>${no}</b>`], ["Placed on", escapeHtml(istDate(o.createdAt))], ["Payment", escapeHtml(payLine(o))], ["Delivery", escapeHtml(etaText(o.createdAt))]]) +
      h2("Order summary") + itemsTable(o, siteUrl) +
      h2("Delivering to") + addressHtml(o.deliveryAddress) +
      h2("Where your order is") + tracker(steps) +
      (opts.receiptAttached ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6">Your receipt is attached to this email (PDF). You can also download it any time from your order page.</p>` : "") +
      `<p style="margin:24px 0 0">${button(`${siteUrl}/account/orders/${o.id}`, "TRACK MY ORDER")}</p>`,
    siteUrl
  );
  const text = [`Order confirmed — ${no}`, "", `Placed on: ${istDate(o.createdAt)}`, "", ...o.items.map((i) => `${i.title} (${[i.size, i.color].filter(Boolean).join(", ")}) x${i.quantity} — ${inr(i.pricePaise * i.quantity)}`), "", ...totalsRows(o).map(([k, v]) => `${k}: ${v}`), `TOTAL: ${inr(o.totalPaise)}`, "", "Delivering to:", ...addressLines(o.deliveryAddress), "", `Payment: ${payLine(o)}`, `Estimated delivery: ${etaText(o.createdAt)}`, "", "Where your order is:", ...trackerText(steps), "", `Your orders: ${siteUrl}/account/orders`, `Need help? Call or WhatsApp ${supportNumber()}, or reply to this email.`].join("\n");
  return { subject: oneLine(subject), html, text };
}

export function adminOrderEmail(o: MailOrder, siteUrl: string) {
  const no = orderNumber(o.id);
  const cod = o.paymentMethod === "cod";
  const subject = `New order ${no} — ${inr(o.totalPaise)}${cod ? " (COD)" : ""}`;
  const html = teamShell(
    `New order ${no}`,
    `${escapeHtml(o.deliveryAddress.name)} placed an order for <b>${inr(o.totalPaise)}</b> — ${escapeHtml(payLine(o))}.${cod ? " <b>Confirm the COD order with the customer.</b>" : ""}`,
    details([["Customer", escapeHtml(o.deliveryAddress.name)], ["Email", mailLink(o.deliveryAddress.email)], ["Phone", telLink(o.deliveryAddress.phone)], ["Placed on", escapeHtml(istDateTime(o.createdAt))], ["Payment", escapeHtml(payLine(o))]]) +
      h2("Items") + itemsTable(o, siteUrl) +
      h2("Deliver to") + addressHtml(o.deliveryAddress) +
      `<p style="margin:24px 0 0">${button(`${siteUrl}/portal-secure/orders/${o.id}`, "OPEN IN ADMIN")}</p>`,
    siteUrl
  );
  const text = [`New order ${no} — ${inr(o.totalPaise)}${cod ? " (COD)" : ""}`, "", ...o.items.map((i) => `${i.title} (${[i.size, i.color].filter(Boolean).join(", ")}) x${i.quantity}`), "", ...addressLines(o.deliveryAddress), `Email: ${o.deliveryAddress.email ?? "—"}`, `Payment: ${payLine(o)}`, "", `${siteUrl}/portal-secure/orders/${o.id}`].join("\n");
  return { subject: oneLine(subject), html, text };
}

export function testEmail(siteUrl: string) {
  return {
    subject: "CULTRAVEN — test email",
    html: teamShell("Email is working", "This is a test message from your CULTRAVEN admin panel. Order emails will be delivered the same way.", "", siteUrl),
    text: "CULTRAVEN test email — your SMTP settings work.",
  };
}

// ── Status updates & cancellations ──────────────────────────────────────────────

const STATUS_COPY: Record<string, string> = {
  confirmed: "We've confirmed your order and are packing it.",
  packed: "Your order is packed and ready — it will be handed to the courier shortly.",
  on_hold: "Your order is on hold for a moment while we check a detail. We'll update you as soon as it moves again — nothing is needed from you unless we reach out.",
  delivery_failed: "The courier couldn't deliver your order today. They will usually try again — please keep your phone reachable, or reply to this email to arrange a better time.",
  rto: "Your order couldn't be delivered and is on its way back to us. If you paid online, your refund goes to your original payment method within 5–7 business days.",
  shipped: "Your order is on its way.",
  out_for_delivery: "Your order is out for delivery today — please keep your phone handy.",
  delivered: "Your order has been delivered. We hope you love it! You can return it within 7 days if something isn't right.",
  cancelled: "Your order has been cancelled. We're sorry to see this one go.",
  cancel_requested: "We've received your request to cancel. Because the order has already shipped, we're checking with the courier and will confirm very soon.",
  return_requested: "We've received your return request and will update you shortly.",
  returned: "Your return is complete. Any refund is processed to your original payment method within 5–7 business days.",
};

export interface EmailPick { title: string; pricePaise: number; image?: string; url: string }
export interface StatusEmailInput {
  status: string; note?: string; courier?: string; trackingNumber?: string; trackingUrl?: string;
  /** Products to suggest (used on cancellation emails) */ picks?: EmailPick[];
  /** The order's real tracking steps with the time each was reached (lib/order-lifecycle buildTimeline); worked out from `status` when omitted */ timeline?: TimelineStep[];
}

/** Warm sign-off for a cancelled order: refund note, a few picks, and a link to their wishlist. */
function cancelledExtras(o: MailOrder, siteUrl: string, picks: EmailPick[]): string {
  const refund = o.paymentMethod === "razorpay" && o.paymentStatus !== "pending"
    ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6"><b>Refund:</b> if you paid online, your refund goes back to the original payment method within 5–7 business days.</p>`
    : `<p style="margin:16px 0 0;font-size:14px;line-height:1.6">Nothing was charged — this was a Cash on Delivery order, so there's nothing to refund.</p>`;
  const cards = picks.length
    ? `<p style="margin:22px 0 8px;font-size:12px;font-weight:900;letter-spacing:2px">PICKS FOR YOU</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${[0, 2]
        .map((start) => picks.slice(0, 4).slice(start, start + 2))
        .filter((pair) => pair.length)
        .map(
          (pair) =>
            `<tr>${[0, 1]
              .map((n) => pair[n])
              .map((p) =>
                p
                  ? `<td width="50%" valign="top" style="padding:0 4px 14px"><a href="${escapeHtml(p.url)}" style="text-decoration:none;color:${NAVY}">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" width="100%" style="display:block;width:100%;height:auto;border:2px solid ${NAVY}">` : ""}<div style="font-size:12px;font-weight:900;text-transform:uppercase;margin-top:6px;line-height:1.3">${escapeHtml(p.title)}</div><div style="font-size:13px">${inr(p.pricePaise)}</div></a></td>`
                  : `<td width="50%" style="padding:0 4px"></td>`
              )
              .join("")}</tr>`
        )
        .join("")}</table>`
    : "";
  return `${refund}<p style="margin:18px 0 0;font-size:14px;line-height:1.7;background:${BONE};padding:12px 14px;border-left:4px solid ${GOLD}">Wishing you a great day — and if something on your wishlist is still calling your name, it's waiting for you. <a href="${escapeHtml(siteUrl)}/account/wishlist" style="color:${NAVY};font-weight:900">Open my wishlist →</a></p>${cards}`;
}

const IN_TRANSIT = new Set(["processing", "confirmed", "packed", "shipped", "out_for_delivery", "on_hold", "delivery_failed"]);

/** Sent to the customer whenever the status of their order changes (admin action or their own cancel/return). */
export function orderStatusEmail(o: MailOrder, siteUrl: string, s: StatusEmailInput) {
  const no = orderNumber(o.id);
  const label = isOrderStatus(s.status) ? STATUS_LABEL[s.status] : s.status === "cancel_requested" ? "Cancellation requested" : s.status;
  const subject = `${no}: ${label}`;
  const copy = STATUS_COPY[s.status] ?? "There's an update on your order.";
  const steps = s.timeline ?? (isOrderStatus(s.status) ? buildTimeline({ fulfillmentStatus: s.status, createdAt: o.createdAt }) : []);
  const eta = IN_TRANSIT.has(s.status) ? estimatedDelivery(o.createdAt) : null;
  const rows: [string, string][] = [["Order no.", `<b>${no}</b>`], ["Status", `<b>${escapeHtml(label)}</b>`]];
  if (s.courier) rows.push(["Courier", escapeHtml(s.courier)]);
  if (s.trackingNumber) rows.push(["Tracking no.", `<b>${escapeHtml(s.trackingNumber)}</b>`]);
  if (eta && eta.to.getTime() > Date.now()) rows.push(["Arriving by", escapeHtml(etaShort(eta.to))]);
  const courierUrl = s.trackingUrl && /^https?:\/\//i.test(s.trackingUrl) ? s.trackingUrl : "";
  const body =
    (s.note ? callout(escapeHtml(s.note)) : "") +
    details(rows) +
    (courierUrl ? `<p style="margin:14px 0 0">${button(courierUrl, "TRACK WITH THE COURIER")}</p>` : "") +
    (steps.length ? h2("Order tracker") + tracker(steps) : "") +
    h2("Order summary") + itemsTable(o, siteUrl) +
    (s.status === "cancelled" ? cancelledExtras(o, siteUrl, s.picks ?? []) : "") +
    h2("Delivering to") + addressHtml(o.deliveryAddress) +
    `<p style="margin:24px 0 0">${button(`${siteUrl}/account/orders/${o.id}`, "TRACK MY ORDER")}</p>`;
  const html = shell(`Order ${no}`, escapeHtml(copy), body, siteUrl);
  const text = [`${no}: ${label}`, copy, s.note ? `Note: ${s.note}` : "", s.courier ? `Courier: ${s.courier}` : "", s.trackingNumber ? `Tracking no.: ${s.trackingNumber}` : "", s.trackingUrl ?? "", "", ...(steps.length ? ["Order tracker:", ...trackerText(steps), ""] : []), `Track your order: ${siteUrl}/account/orders/${o.id}`, `Need help? Call or WhatsApp ${supportNumber()}, or reply to this email.`].filter((l) => l !== "").join("\n");
  return { subject: oneLine(subject), html, text };
}

/** Admin alert when a customer cancels an order or asks for a return. */
export function adminCustomerActionEmail(o: MailOrder, siteUrl: string, kind: "cancelled" | "cancel_requested" | "return_requested", reason: string) {
  const no = orderNumber(o.id);
  const what = kind === "cancelled" ? "cancelled" : kind === "cancel_requested" ? "asked to cancel (already shipped)" : "requested a return for";
  const subject = `${kind === "cancelled" ? "Order cancelled" : kind === "cancel_requested" ? "Cancellation requested" : "Return requested"} — ${no}`;
  const html = teamShell(
    subject,
    `${escapeHtml(o.deliveryAddress.name)} ${what} order <b>${no}</b> (${inr(o.totalPaise)}, ${o.paymentMethod === "cod" ? "COD" : "online"}).`,
    callout(`<b>Reason:</b> ${escapeHtml(reason)}`) +
      (kind === "cancelled" && o.paymentMethod === "razorpay" && o.paymentStatus === "paid" ? `<p style="font-size:14px"><b>Paid online — a refund is due.</b></p>` : "") +
      details([["Customer", escapeHtml(o.deliveryAddress.name)], ["Email", mailLink(o.deliveryAddress.email)], ["Phone", telLink(o.deliveryAddress.phone)], ["Order no.", `<b>${no}</b>`]]) +
      h2("Items") + itemsTable(o, siteUrl) +
      `<p style="margin:24px 0 0">${button(`${siteUrl}/portal-secure/orders/${o.id}`, "OPEN IN ADMIN")}</p>`,
    siteUrl
  );
  const text = `${subject}\nCustomer: ${o.deliveryAddress.name}\nReason: ${reason}\n${siteUrl}/portal-secure/orders/${o.id}`;
  return { subject: oneLine(subject), html, text };
}

// ── Support (contact form) ──────────────────────────────────────────────────────

export interface SupportMail { ref: string; name: string; email: string; phone?: string; subject: string; message: string; orderRef?: string }

/** Alert to the support team: the full message, and a one-click reply. */
export function supportAdminEmail(m: SupportMail, siteUrl: string) {
  const subject = `[${m.ref}] ${m.subject}${m.orderRef ? ` — ${m.orderRef}` : ""}`;
  const html = teamShell(
    `New message ${m.ref}`,
    `${escapeHtml(m.name)} wrote in via the Contact us form.`,
    details([["From", escapeHtml(m.name)], ["Email", mailLink(m.email)], ["Phone", telLink(m.phone)], ["Order", escapeHtml(m.orderRef || "—")], ["Reference", escapeHtml(m.ref)]]) +
      h2("Subject") + `<p style="margin:0;font-size:15px;font-weight:700">${escapeHtml(m.subject)}</p>` +
      h2("Message") + `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;background:${BONE};padding:12px 14px;border-left:4px solid ${GOLD};white-space:pre-wrap">${escapeHtml(m.message)}</p>` +
      `<p style="margin:20px 0 0">${looksLikeEmail(m.email) ? `${button(`mailto:${m.email}?subject=${encodeURIComponent(`Re: [${m.ref}] ${m.subject}`)}`, "REPLY")} ` : ""}<a href="${escapeHtml(siteUrl)}/portal-secure/support" style="display:inline-block;padding:14px 8px;color:${NAVY};font-weight:900;font-size:13px">Open support inbox →</a></p>`,
    siteUrl
  );
  const text = `${subject}\n\nFrom: ${m.name} <${m.email}> ${m.phone || ""}\nOrder: ${m.orderRef || "-"}\n\n${m.message}\n\n${siteUrl}/portal-secure/support`;
  return { subject: oneLine(subject), html, text };
}

/** Acknowledgement to the customer with their reference number. */
export function supportAckEmail(m: SupportMail, siteUrl: string, hours: string) {
  const subject = `We got your message — ${m.ref}`;
  const html = shell(
    "We got your message",
    `Hi ${escapeHtml(m.name.split(" ")[0])}, thanks for contacting CULTRAVEN. Your reference is <b>${escapeHtml(m.ref)}</b>. We usually reply within 24 hours (${escapeHtml(hours)}).`,
    h2("Your message") + `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;background:${BONE};padding:12px 14px;border-left:4px solid ${GOLD};white-space:pre-wrap">${escapeHtml(m.message)}</p>` +
      `<p style="margin:0;font-size:13px;line-height:1.7">In a hurry? Many answers are in our <a href="${escapeHtml(siteUrl)}/help" style="color:${NAVY};font-weight:900">Help Center</a>, and you can track, cancel or return an order from <a href="${escapeHtml(siteUrl)}/account/orders" style="color:${NAVY};font-weight:900">your orders</a>.</p>`,
    siteUrl
  );
  const text = `We got your message — ${m.ref}\n\nThanks ${m.name.split(" ")[0]}. We usually reply within 24 hours (${hours}).\n\nYour message:\n${m.message}\n\nHelp Center: ${siteUrl}/help\nNeed help sooner? Call or WhatsApp ${supportNumber()}`;
  return { subject: oneLine(subject), html, text };
}

// ── Account & security emails ───────────────────────────────────────────────────

/** Welcome email right after a customer creates their account. */
export function welcomeEmail(opts: { firstName: string; siteUrl: string }) {
  const { firstName, siteUrl } = opts;
  const perk = (title: string, text: string) => `<tr><td valign="top" style="padding:10px 0;border-bottom:1px solid ${BONE};font-size:14px;line-height:1.6"><b>${title}</b><br><span style="color:${MUTED}">${text}</span></td></tr>`;
  const subject = oneLine(firstName) ? `Welcome to CULTRAVEN, ${firstName}` : "Welcome to CULTRAVEN";
  const html = shell(
    "Welcome to CULTRAVEN",
    `Hi ${escapeHtml(firstName)}, your account is ready. Here is what you can do with it:`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BONE}">${perk("Track every order", "Follow each order step by step, from packed to delivered.")}${perk("Easy returns", `Not right? Return it within ${RETURN_WINDOW_DAYS} days from your orders page.`)}${perk("Faster checkout", "Save your addresses and favourites so next time takes seconds.")}</table>` +
      `<p style="margin:14px 0 0;padding:10px 12px;background:${BONE};border-left:4px solid ${GOLD};font-size:13px"><b>Free delivery</b> above ${inr(FREE_SHIPPING_THRESHOLD)} &middot; <b>Cash on Delivery</b> available</p>` +
      `<p style="margin:24px 0 0">${button(`${siteUrl}/collections`, "START SHOPPING")} <a href="${escapeHtml(siteUrl)}/account" style="display:inline-block;padding:14px 8px;color:${NAVY};font-weight:900;font-size:13px">My account →</a></p>`,
    siteUrl
  );
  const text = `Welcome to CULTRAVEN, ${firstName}\n\nYour account is ready.\n- Track every order step by step\n- ${RETURN_WINDOW_DAYS}-day easy returns\n- Faster checkout with saved addresses\n\nStart shopping: ${siteUrl}/collections\nNeed help? Call or WhatsApp ${supportNumber()}`;
  return { subject: oneLine(subject), html, text };
}

/** The "Forgot password" email: a single-use link that expires. It never contains a password. */
export function passwordResetEmail(opts: { firstName: string; email: string; resetUrl: string; expiresMinutes: number; requestedAt: Date; siteUrl: string }) {
  const { firstName, email, resetUrl, expiresMinutes, requestedAt, siteUrl } = opts;
  const subject = "Reset your CULTRAVEN password";
  const html = securityShell(
    "Reset your password",
    `Hi ${escapeHtml(firstName)}, we received a request to reset the password for your CULTRAVEN account (${escapeHtml(maskEmail(email))}). Use the button below to choose a new one.`,
    `<p style="margin:0 0 6px">${button(resetUrl, "RESET MY PASSWORD")}</p>` +
      `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:${MUTED}">This link works for <b>${expiresMinutes} minutes</b> and can be used <b>once</b>.</p>` +
      h2("Button not working?") +
      `<p style="margin:0 0 4px;font-size:13px;line-height:1.6">Copy this link into your browser:</p><p style="margin:0;font-size:12px;line-height:1.6;background:#fff;border:1px solid ${BONE};padding:10px 12px;word-break:break-all"><a href="${escapeHtml(resetUrl)}" style="color:${NAVY};text-decoration:underline">${escapeHtml(resetUrl)}</a></p>` +
      h2("Didn't ask for this?") +
      callout(`You can safely ignore this email — <b>your password will not change</b> unless you use the link above. If these emails keep coming, call or WhatsApp us on ${supportTel()}.`, RED) +
      `<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED}">Requested on ${escapeHtml(istDateTime(requestedAt))}. For your safety, CULTRAVEN will never ask for your password, OTP or card details over a call, WhatsApp or email.</p>`,
    siteUrl
  );
  const text = `Reset your CULTRAVEN password\n\nHi ${firstName}, we received a request to reset the password for your account (${maskEmail(email)}).\n\nChoose a new password here (works for ${expiresMinutes} minutes, one use):\n${resetUrl}\n\nDidn't ask for this? Ignore this email — your password will not change.\nNeed help? Call or WhatsApp ${supportNumber()}\n\nCULTRAVEN will never ask for your password, OTP or card details.`;
  return { subject: oneLine(subject), html, text };
}

/** Security notice after a password changes (reset link, "change password" on the account page, or an administrator). */
export function passwordChangedEmail(opts: { firstName: string; changedAt: Date; signInUrl: string; resetUrl: string; siteUrl: string }) {
  const { firstName, changedAt, signInUrl, resetUrl, siteUrl } = opts;
  const subject = "Your CULTRAVEN password was changed";
  const html = securityShell(
    "Password changed",
    `Hi ${escapeHtml(firstName)}, the password for your CULTRAVEN account was changed on <b>${escapeHtml(istDateTime(changedAt))}</b>. You have been signed out on your other devices.`,
    `<p style="margin:0 0 6px">${button(signInUrl, "SIGN IN")}</p>` +
      h2("Wasn't you?") +
      callout(`If you did not change your password, someone else may have access to your account. <a href="${escapeHtml(resetUrl)}" style="color:${NAVY};font-weight:900;text-decoration:underline">Reset your password now</a> and call or WhatsApp us on ${supportTel()}.`, RED) +
      `<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED}">If you made this change, there is nothing more to do.</p>`,
    siteUrl
  );
  const text = `Your CULTRAVEN password was changed\n\nHi ${firstName}, the password for your account was changed on ${istDateTime(changedAt)}. You have been signed out on your other devices.\n\nSign in: ${signInUrl}\n\nWasn't you? Reset your password now: ${resetUrl}\nOr call/WhatsApp ${supportNumber()}.`;
  return { subject: oneLine(subject), html, text };
}

// ── Staff account emails ────────────────────────────────────────────────────────

/** Sent to a newly created staff member: a secure "set your password" link — never the password itself. */
export function staffAccountCreatedEmail(opts: {
  firstName: string; email: string; setPasswordUrl: string; expiresHours: number;
  role: "admin" | "delivery" | "customer"; loginUrl: string; siteUrl: string;
}) {
  const { firstName, email, setPasswordUrl, expiresHours, role, loginUrl, siteUrl } = opts;
  const roleLabel = role === "admin" ? "Admin" : role === "delivery" ? "Delivery Staff" : "Staff";
  const portalName = role === "delivery" ? "Delivery Portal" : "Admin Panel";
  const subject = `Your CULTRAVEN ${roleLabel} account is ready`;
  const html = accountShell(
    `${roleLabel} account created`,
    `Hi ${escapeHtml(firstName)}, your CULTRAVEN ${roleLabel} account has been created. Choose your own password to start using the ${escapeHtml(portalName)}.`,
    details([["Sign-in email", mailLink(email)], ["Portal", escapeHtml(portalName)]]) +
      `<p style="margin:20px 0 6px">${button(setPasswordUrl, "SET MY PASSWORD")}</p>` +
      `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:${MUTED}">This link works for <b>${expiresHours} hours</b> and can be used <b>once</b>. If it has expired, ask the administrator who added you to send a new one. After that, sign in at <a href="${escapeHtml(loginUrl)}" style="color:${NAVY};font-weight:700;text-decoration:underline">${escapeHtml(portalName)} sign-in</a>.</p>` +
      h2("Button not working?") +
      `<p style="margin:0;font-size:12px;line-height:1.6;background:#fff;border:1px solid ${BONE};padding:10px 12px;word-break:break-all"><a href="${escapeHtml(setPasswordUrl)}" style="color:${NAVY};text-decoration:underline">${escapeHtml(setPasswordUrl)}</a></p>`,
    siteUrl
  );
  const text = `Your CULTRAVEN ${roleLabel} account\n\nHi ${firstName}, your account (${email}) has been created.\n\nChoose your password (link works for ${expiresHours} hours, one use):\n${setPasswordUrl}\n\nThen sign in: ${loginUrl}`;
  return { subject: oneLine(subject), html, text };
}

/** Sent to super admin when a delivery partner submits their KYC. */
export function deliveryKYCSubmittedEmail(opts: {
  partnerName: string; partnerEmail: string; adminUrl: string; siteUrl: string;
}) {
  const { partnerName, partnerEmail, adminUrl, siteUrl } = opts;
  const subject = `New delivery partner verification — ${partnerName}`;
  const html = teamShell(
    "Delivery partner verification",
    `${escapeHtml(partnerName)} (${escapeHtml(partnerEmail)}) has submitted their KYC documents and is awaiting verification.`,
    details([["Partner", escapeHtml(partnerName)], ["Email", mailLink(partnerEmail)]]) +
      `<p style="margin:20px 0 0">${button(adminUrl, "REVIEW DOCUMENTS")}</p>`,
    siteUrl
  );
  const text = `${partnerName} (${partnerEmail}) submitted KYC for delivery partner verification.\n\nReview: ${adminUrl}`;
  return { subject: oneLine(subject), html, text };
}

/** Sent to the delivery partner after admin approves or rejects their KYC. */
export function deliveryKYCDecisionEmail(opts: {
  firstName: string; approved: boolean; note?: string; loginUrl: string; siteUrl: string;
}) {
  const { firstName, approved, note, loginUrl, siteUrl } = opts;
  const subject = approved ? "Your delivery account is approved — welcome!" : "Delivery account verification update";
  const body = approved
    ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6">Congratulations! Your account is verified and you now have full access to the Delivery Portal. Start accepting and delivering orders.</p><p style="margin:0">${button(loginUrl, "OPEN DELIVERY PORTAL")}</p>`
    : `<p style="margin:0 0 14px;font-size:14px;line-height:1.6">Unfortunately, we were unable to verify your account at this time.${note ? ` Reason: <b>${escapeHtml(note)}</b>.` : ""} Please re-submit your documents from the portal, addressing the issue above.</p><p style="margin:0">${button(loginUrl, "RE-SUBMIT DOCUMENTS")}</p>`;
  const html = accountShell(
    approved ? "Account approved" : "Verification unsuccessful",
    `Hi ${escapeHtml(firstName)}, here is an update on your CULTRAVEN delivery partner application.`,
    body,
    siteUrl
  );
  const text = approved
    ? `Hi ${firstName}, your delivery account has been approved! Sign in: ${loginUrl}`
    : `Hi ${firstName}, your delivery account verification was unsuccessful.${note ? ` Reason: ${note}.` : ""}\n\nResubmit: ${loginUrl}`;
  return { subject: oneLine(subject), html, text };
}
