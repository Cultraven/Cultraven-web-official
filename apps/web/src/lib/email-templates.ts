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

export function customerOrderEmail(o: MailOrder, siteUrl: string) {
  const no = orderNumber(o.id);
  const subject = `Order confirmed — ${no}`;
  const html = shell(
    "Order confirmed",
    `Hi ${escapeHtml(o.deliveryAddress.name.split(" ")[0])}, thanks for your order <b>${no}</b>. We're getting it ready.`,
    itemsTable(o) + addressBlock(o) + `<p style="margin:24px 0 0"><a href="${escapeHtml(siteUrl)}/account/orders" style="display:inline-block;background:${NAVY};color:${CREAM};padding:12px 20px;text-decoration:none;font-weight:900;font-size:13px;letter-spacing:2px;border-bottom:4px solid ${GOLD}">VIEW MY ORDERS</a></p>`,
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
