/** Order emails (customer confirmation + admin alert). Pure functions: HTML is table-based with inline CSS, text fallback included. */

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

const NAVY = "#172554", GOLD = "#DAB205", CREAM = "#FAF9F6", BONE = "#EDE3CF";

function addressLines(a: MailOrder["deliveryAddress"]): string[] {
  return [a.name, a.line1, a.line2 ?? "", `${a.city}, ${a.state} ${a.pincode}`, `Phone: ${a.phone}`].filter(Boolean);
}

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

function shell(title: string, intro: string, body: string, siteUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:${BONE};font-family:Arial,Helvetica,sans-serif;color:${NAVY}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BONE};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CREAM};border:2px solid ${NAVY}">
<tr><td style="background:${NAVY};padding:18px 24px;color:${CREAM};font-weight:900;letter-spacing:4px;font-size:18px">CULTRAVEN</td></tr>
<tr><td style="height:6px;background:${GOLD};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 8px;font-size:22px;text-transform:uppercase">${escapeHtml(title)}</h1><p style="margin:0 0 20px;font-size:14px;line-height:1.6">${intro}</p>${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:2px solid ${NAVY};font-size:12px;color:#555">Questions? Reply to this email or visit <a href="${escapeHtml(siteUrl)}" style="color:${NAVY}">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>.</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: MailOrder): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px">${o.items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${BONE};font-size:14px"><b>${escapeHtml(i.title)}</b><br><span style="color:#666;font-size:12px">${escapeHtml([i.size, i.color].filter(Boolean).join(" · "))} · Qty ${i.quantity}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid ${BONE};font-size:14px;white-space:nowrap">${inr(i.pricePaise * i.quantity)}</td></tr>`
    )
    .join("")}${totalsRows(o)
    .map(([k, v]) => `<tr><td style="padding:4px 0;font-size:13px;color:#555">${k}</td><td align="right" style="padding:4px 0;font-size:13px">${v}</td></tr>`)
    .join("")}<tr><td style="padding:10px 0;font-size:16px;font-weight:900;border-top:2px solid ${NAVY}">TOTAL</td><td align="right" style="padding:10px 0;font-size:16px;font-weight:900;border-top:2px solid ${NAVY}">${inr(o.totalPaise)}</td></tr></table>`;
}

function addressBlock(o: MailOrder): string {
  return `<p style="margin:16px 0 4px;font-size:12px;font-weight:900;letter-spacing:2px">DELIVERING TO</p><p style="margin:0;font-size:14px;line-height:1.6">${addressLines(o.deliveryAddress).map(escapeHtml).join("<br>")}</p>
<p style="margin:16px 0 4px;font-size:12px;font-weight:900;letter-spacing:2px">PAYMENT</p><p style="margin:0;font-size:14px">${escapeHtml(payLine(o))}</p>
<p style="margin:16px 0 4px;font-size:12px;font-weight:900;letter-spacing:2px">ESTIMATED DELIVERY</p><p style="margin:0;font-size:14px">3–5 business days</p>`;
}

export function customerOrderEmail(o: MailOrder, siteUrl: string, opts: { receiptAttached?: boolean } = {}) {
  const no = orderNumber(o.id);
  const subject = `Order confirmed — ${no}`;
  const html = shell(
    "Order confirmed",
    `Hi ${escapeHtml(o.deliveryAddress.name.split(" ")[0])}, thanks for your order <b>${no}</b>. We're getting it ready.`,
    itemsTable(o) + addressBlock(o) + (opts.receiptAttached ? `<p style="margin:16px 0 0;font-size:13px">Your receipt is attached to this email (PDF). You can also download it any time from your order page.</p>` : "") + `<p style="margin:24px 0 0"><a href="${escapeHtml(siteUrl)}/account/orders/${escapeHtml(o.id)}" style="display:inline-block;background:${NAVY};color:${CREAM};padding:12px 20px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">TRACK MY ORDER</a></p>`,
    siteUrl
  );
  const text = [`Order confirmed — ${no}`, "", ...o.items.map((i) => `${i.title} (${[i.size, i.color].filter(Boolean).join(", ")}) x${i.quantity} — ${inr(i.pricePaise * i.quantity)}`), "", ...totalsRows(o).map(([k, v]) => `${k}: ${v}`), `TOTAL: ${inr(o.totalPaise)}`, "", "Delivering to:", ...addressLines(o.deliveryAddress), "", `Payment: ${payLine(o)}`, "Estimated delivery: 3–5 business days", "", `Your orders: ${siteUrl}/account/orders`].join("\n");
  return { subject, html, text };
}

export function adminOrderEmail(o: MailOrder, siteUrl: string) {
  const no = orderNumber(o.id);
  const cod = o.paymentMethod === "cod";
  const subject = `New order ${no} — ${inr(o.totalPaise)}${cod ? " (COD)" : ""}`;
  const html = shell(
    `New order ${no}`,
    `${escapeHtml(o.deliveryAddress.name)} placed an order for <b>${inr(o.totalPaise)}</b> — ${escapeHtml(payLine(o))}.${cod ? " <b>Confirm the COD order with the customer.</b>" : ""}`,
    itemsTable(o) + addressBlock(o) + `<p style="margin:12px 0 0;font-size:13px">Customer email: ${escapeHtml(o.deliveryAddress.email ?? "—")}</p><p style="margin:24px 0 0"><a href="${escapeHtml(siteUrl)}/portal-secure/orders/${escapeHtml(o.id)}" style="display:inline-block;background:${NAVY};color:${CREAM};padding:12px 20px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">OPEN IN ADMIN</a></p>`,
    siteUrl
  );
  const text = [`New order ${no} — ${inr(o.totalPaise)}${cod ? " (COD)" : ""}`, "", ...o.items.map((i) => `${i.title} (${[i.size, i.color].filter(Boolean).join(", ")}) x${i.quantity}`), "", ...addressLines(o.deliveryAddress), `Email: ${o.deliveryAddress.email ?? "—"}`, `Payment: ${payLine(o)}`, "", `${siteUrl}/portal-secure/orders/${o.id}`].join("\n");
  return { subject, html, text };
}

export function testEmail(siteUrl: string) {
  return {
    subject: "CULTRAVEN — test email",
    html: shell("Email is working", "This is a test message from your CULTRAVEN admin panel. Order emails will be delivered the same way.", "", siteUrl),
    text: "CULTRAVEN test email — your SMTP settings work.",
  };
}

// ── Status updates & cancellations ──────────────────────────────────────────────

import { STATUS_LABEL, isOrderStatus } from "@/lib/order-lifecycle";

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
export interface StatusEmailInput { status: string; note?: string; courier?: string; trackingNumber?: string; trackingUrl?: string; /** Products to suggest (used on cancellation emails) */ picks?: EmailPick[] }

/** Warm sign-off for a cancelled order: refund note, a few picks, and a link to their wishlist. */
function cancelledExtras(o: MailOrder, siteUrl: string, picks: EmailPick[]): string {
  const refund = o.paymentMethod === "razorpay" && o.paymentStatus !== "pending"
    ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6"><b>Refund:</b> if you paid online, your refund goes back to the original payment method within 5–7 business days.</p>`
    : `<p style="margin:16px 0 0;font-size:14px;line-height:1.6">Nothing was charged — this was a Cash on Delivery order, so there's nothing to refund.</p>`;
  const cards = picks.length
    ? `<p style="margin:22px 0 8px;font-size:12px;font-weight:900;letter-spacing:2px">PICKS FOR YOU</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${picks
        .slice(0, 4)
        .map(
          (p) => `<td width="25%" valign="top" style="padding:0 4px"><a href="${escapeHtml(p.url)}" style="text-decoration:none;color:${NAVY}">${p.image ? `<img src="${escapeHtml(p.image)}" alt="" width="100%" style="display:block;border:2px solid ${NAVY};aspect-ratio:3/4;object-fit:cover">` : ""}<div style="font-size:11px;font-weight:900;text-transform:uppercase;margin-top:6px;line-height:1.3">${escapeHtml(p.title)}</div><div style="font-size:12px">${inr(p.pricePaise)}</div></a></td>`
        )
        .join("")}</tr></table>`
    : "";
  return `${refund}<p style="margin:18px 0 0;font-size:14px;line-height:1.7;background:${BONE};padding:12px 14px;border-left:4px solid ${GOLD}">Wishing you a great day — and if something on your wishlist is still calling your name, it's waiting for you. <a href="${escapeHtml(siteUrl)}/account/wishlist" style="color:${NAVY};font-weight:900">Open my wishlist →</a></p>${cards}`;
}

/** Sent to the customer whenever the status of their order changes (admin action or their own cancel/return). */
export function orderStatusEmail(o: MailOrder, siteUrl: string, s: StatusEmailInput) {
  const no = orderNumber(o.id);
  const label = isOrderStatus(s.status) ? STATUS_LABEL[s.status] : s.status === "cancel_requested" ? "Cancellation requested" : s.status;
  const subject = `${no}: ${label}`;
  const copy = STATUS_COPY[s.status] ?? "There's an update on your order.";
  const trackBits = [s.courier && `Courier: <b>${escapeHtml(s.courier)}</b>`, s.trackingNumber && `Tracking no.: <b>${escapeHtml(s.trackingNumber)}</b>`].filter(Boolean).join("<br>");
  const body =
    `<p style="margin:0 0 6px;font-size:12px;font-weight:900;letter-spacing:2px">STATUS</p><p style="margin:0 0 14px;font-size:18px;font-weight:900;text-transform:uppercase">${escapeHtml(label)}</p>` +
    (s.note ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;background:${BONE};padding:10px 12px;border-left:4px solid ${GOLD}">${escapeHtml(s.note)}</p>` : "") +
    (trackBits ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.7">${trackBits}</p>` : "") +
    (s.trackingUrl && /^https?:\/\//i.test(s.trackingUrl) ? `<p style="margin:0 0 14px"><a href="${escapeHtml(s.trackingUrl)}" style="color:${NAVY};font-weight:900">Track with the courier →</a></p>` : "") +
    itemsTable(o) +
    (s.status === "cancelled" ? cancelledExtras(o, siteUrl, s.picks ?? []) : "") +
    `<p style="margin:24px 0 0"><a href="${escapeHtml(siteUrl)}/account/orders/${escapeHtml(o.id)}" style="display:inline-block;background:${NAVY};color:${CREAM};padding:12px 20px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">TRACK MY ORDER</a></p>`;
  const html = shell(`Order ${no}`, escapeHtml(copy), body, siteUrl);
  const text = [`${no}: ${label}`, copy, s.note ? `Note: ${s.note}` : "", s.courier ? `Courier: ${s.courier}` : "", s.trackingNumber ? `Tracking no.: ${s.trackingNumber}` : "", s.trackingUrl ?? "", "", `Track your order: ${siteUrl}/account/orders/${o.id}`].filter((l) => l !== "").join("\n");
  return { subject, html, text };
}

/** Admin alert when a customer cancels an order or asks for a return. */
export function adminCustomerActionEmail(o: MailOrder, siteUrl: string, kind: "cancelled" | "cancel_requested" | "return_requested", reason: string) {
  const no = orderNumber(o.id);
  const what = kind === "cancelled" ? "cancelled" : kind === "cancel_requested" ? "asked to cancel (already shipped)" : "requested a return for";
  const subject = `${kind === "cancelled" ? "Order cancelled" : kind === "cancel_requested" ? "Cancellation requested" : "Return requested"} — ${no}`;
  const html = shell(
    subject,
    `${escapeHtml(o.deliveryAddress.name)} ${what} order <b>${no}</b> (${inr(o.totalPaise)}, ${o.paymentMethod === "cod" ? "COD" : "online"}).`,
    `<p style="margin:0 0 14px;font-size:14px;background:${BONE};padding:10px 12px;border-left:4px solid ${GOLD}"><b>Reason:</b> ${escapeHtml(reason)}</p>` +
      (kind === "cancelled" && o.paymentMethod === "razorpay" && o.paymentStatus === "paid" ? `<p style="font-size:14px"><b>Paid online — a refund is due.</b></p>` : "") +
      itemsTable(o) +
      `<p style="margin:24px 0 0"><a href="${escapeHtml(siteUrl)}/portal-secure/orders/${escapeHtml(o.id)}" style="display:inline-block;background:${NAVY};color:${CREAM};padding:12px 20px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">OPEN IN ADMIN</a></p>`,
    siteUrl
  );
  const text = `${subject}\nCustomer: ${o.deliveryAddress.name}\nReason: ${reason}\n${siteUrl}/portal-secure/orders/${o.id}`;
  return { subject, html, text };
}

// ── Support (contact form) ──────────────────────────────────────────────────────

export interface SupportMail { ref: string; name: string; email: string; phone?: string; subject: string; message: string; orderRef?: string }

/** Alert to the support team: the full message, and a one-click reply. */
export function supportAdminEmail(m: SupportMail, siteUrl: string) {
  const subject = `[${m.ref}] ${m.subject}${m.orderRef ? ` — ${m.orderRef}` : ""}`;
  const html = shell(
    `New message ${m.ref}`,
    `${escapeHtml(m.name)} wrote in via the Contact us form.`,
    `<p style="margin:0 0 6px;font-size:12px;font-weight:900;letter-spacing:2px">SUBJECT</p><p style="margin:0 0 14px;font-size:15px;font-weight:700">${escapeHtml(m.subject)}</p>` +
      `<p style="margin:0 0 6px;font-size:12px;font-weight:900;letter-spacing:2px">MESSAGE</p><p style="margin:0 0 14px;font-size:14px;line-height:1.7;background:${BONE};padding:12px 14px;border-left:4px solid ${GOLD};white-space:pre-wrap">${escapeHtml(m.message)}</p>` +
      `<p style="margin:0;font-size:13px;line-height:1.8">From: <b>${escapeHtml(m.name)}</b> &lt;${escapeHtml(m.email)}&gt;<br>Phone: ${escapeHtml(m.phone || "—")}<br>Order: ${escapeHtml(m.orderRef || "—")}</p>` +
      `<p style="margin:20px 0 0"><a href="mailto:${escapeHtml(m.email)}?subject=${encodeURIComponent(`Re: [${m.ref}] ${m.subject}`)}" style="display:inline-block;background:${NAVY};color:${CREAM};padding:12px 20px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">REPLY</a> <a href="${escapeHtml(siteUrl)}/portal-secure/support" style="display:inline-block;padding:12px 8px;color:${NAVY};font-weight:900;font-size:13px">Open support inbox →</a></p>`,
    siteUrl
  );
  const text = `${subject}\n\nFrom: ${m.name} <${m.email}> ${m.phone || ""}\nOrder: ${m.orderRef || "-"}\n\n${m.message}\n\n${siteUrl}/portal-secure/support`;
  return { subject, html, text };
}

/** Acknowledgement to the customer with their reference number. */
export function supportAckEmail(m: SupportMail, siteUrl: string, hours: string) {
  const subject = `We got your message — ${m.ref}`;
  const html = shell(
    "We got your message",
    `Hi ${escapeHtml(m.name.split(" ")[0])}, thanks for contacting CULTRAVEN. Your reference is <b>${escapeHtml(m.ref)}</b>. We usually reply within 24 hours (${escapeHtml(hours)}).`,
    `<p style="margin:0 0 6px;font-size:12px;font-weight:900;letter-spacing:2px">YOUR MESSAGE</p><p style="margin:0 0 14px;font-size:14px;line-height:1.7;background:${BONE};padding:12px 14px;border-left:4px solid ${GOLD};white-space:pre-wrap">${escapeHtml(m.message)}</p>` +
      `<p style="margin:0;font-size:13px;line-height:1.7">In a hurry? Many answers are in our <a href="${escapeHtml(siteUrl)}/help" style="color:${NAVY};font-weight:900">Help Center</a>, and you can track, cancel or return an order from <a href="${escapeHtml(siteUrl)}/account/orders" style="color:${NAVY};font-weight:900">your orders</a>.</p>`,
    siteUrl
  );
  const text = `We got your message — ${m.ref}\n\nThanks ${m.name.split(" ")[0]}. We usually reply within 24 hours (${hours}).\n\nYour message:\n${m.message}\n\nHelp Center: ${siteUrl}/help`;
  return { subject, html, text };
}
