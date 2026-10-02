/**
 * Order receipt as a PDF (pdf-lib, pure JS — works on serverless). Used by the download button and attached to the
 * order confirmation email. The built-in Helvetica font has no ₹ glyph or non-Latin letters, so money is printed as
 * "Rs." and any character the font can't encode is replaced with "?" instead of crashing.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { orderNumber } from "@/lib/email-templates";
import type { MailOrder } from "@/lib/email-templates";

export interface SellerInfo { name: string; address: string[]; gstin: string; email: string }

export function sellerInfo(env: NodeJS.ProcessEnv = process.env): SellerInfo {
  return {
    name: env.INVOICE_SELLER_NAME || "CULTRAVEN CLOTHING PVT LTD",
    address: (env.INVOICE_SELLER_ADDRESS || "Plot 42, AB Road, Vijay Nagar|Indore, Madhya Pradesh 452010").split("|"),
    gstin: env.INVOICE_SELLER_GSTIN || "23AABCB1234D1ZX",
    email: env.INVOICE_SELLER_EMAIL || "support@cultraven.com",
  };
}

const NAVY = rgb(0.09, 0.145, 0.329);
const GOLD = rgb(0.855, 0.698, 0.02);
const GREY = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.85, 0.82, 0.75);

export const rs = (paise: number) => `Rs. ${(paise / 100).toLocaleString("en-IN")}`;

/** Replace characters the font can't draw. */
export function safeText(font: PDFFont, s: string): string {
  const set = new Set(font.getCharacterSet());
  let out = "";
  for (const ch of String(s ?? "").replace(/[\r\n\t]+/g, " ")) out += set.has(ch.codePointAt(0)!) ? ch : "?";
  return out;
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = safeText(font, text).split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) cur = next;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export async function buildInvoicePdf(o: MailOrder & { razorpayPaymentId?: string }, seller: SellerInfo = sellerInfo()): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 44;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (s: string, x: number, yy: number, size = 10, font = reg, color = NAVY) => page.drawText(safeText(font, s), { x, y: yy, size, font, color });
  const right = (s: string, xr: number, yy: number, size = 10, font = reg, color = NAVY) => { const t = safeText(font, s); page.drawText(t, { x: xr - font.widthOfTextAtSize(t, size), y: yy, size, font, color }); };

  // Header band
  page.drawRectangle({ x: 0, y: H - 78, width: W, height: 78, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 82, width: W, height: 4, color: GOLD });
  text("CULTRAVEN", M, H - 48, 22, bold, rgb(0.98, 0.96, 0.92));
  right("ORDER RECEIPT", W - M, H - 46, 12, bold, rgb(0.98, 0.96, 0.92));
  y = H - 110;

  // Meta
  const no = orderNumber(o.id);
  text(`Order ${no}`, M, y, 13, bold);
  right(`Date: ${new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, W - M, y, 10);
  y -= 18;
  text(seller.name, M, y, 9, bold); right(`GSTIN: ${seller.gstin}`, W - M, y, 9, reg, GREY);
  y -= 12;
  for (const l of seller.address) { text(l, M, y, 9, reg, GREY); y -= 11; }
  y -= 10;

  // Addresses
  const a = o.deliveryAddress;
  text("DELIVERED TO", M, y, 8, bold, GREY);
  text("PAYMENT", W / 2 + 10, y, 8, bold, GREY);
  y -= 13;
  const addrLines = [a.name, a.line1, a.line2 ?? "", `${a.city}, ${a.state} ${a.pincode}`, `Phone: ${a.phone}`, a.email ? `Email: ${a.email}` : ""].filter(Boolean);
  let ay = y;
  for (const l of addrLines) for (const w of wrap(reg, l, 10, W / 2 - M - 20)) { text(w, M, ay, 10); ay -= 13; }
  const pay = o.paymentMethod === "cod" ? ["Cash on Delivery", `Amount due on delivery: ${rs(o.totalPaise)}`] : [o.paymentStatus === "paid" ? "Paid online (Razorpay)" : "Online payment (pending)", o.razorpayPaymentId ? `Payment ID: ${o.razorpayPaymentId}` : ""].filter(Boolean);
  let py = y;
  for (const l of pay) for (const w of wrap(reg, l, 10, W / 2 - M - 10)) { text(w, W / 2 + 10, py, 10); py -= 13; }
  y = Math.min(ay, py) - 12;

  // Items table
  const col = { item: M, qty: 360, unit: 440, amt: W - M };
  page.drawRectangle({ x: M - 4, y: y - 5, width: W - 2 * M + 8, height: 20, color: rgb(0.93, 0.89, 0.81) });
  text("ITEM", col.item, y, 9, bold); right("QTY", col.qty + 20, y, 9, bold); right("PRICE", col.unit + 30, y, 9, bold); right("AMOUNT", col.amt, y, 9, bold);
  y -= 22;
  for (const it of o.items) {
    if (y < 160) { page = pdf.addPage([W, H]); y = H - M; }
    const lines = wrap(reg, it.title, 10, 290);
    const sub = [it.size && `Size ${it.size}`, it.color].filter(Boolean).join(" / ");
    lines.forEach((l, i) => text(l, col.item, y - i * 12, 10, i === 0 ? bold : reg));
    if (sub) text(sub, col.item, y - lines.length * 12, 8.5, reg, GREY);
    right(String(it.quantity), col.qty + 20, y, 10); right(rs(it.pricePaise), col.unit + 30, y, 10); right(rs(it.pricePaise * it.quantity), col.amt, y, 10);
    y -= lines.length * 12 + (sub ? 12 : 0) + 8;
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.5, color: LINE });
  }

  // Totals
  if (y < 170) { page = pdf.addPage([W, H]); y = H - M; }
  y -= 8;
  const row = (k: string, v: string, strong = false) => { text(k, 360, y, strong ? 11 : 10, strong ? bold : reg); right(v, W - M, y, strong ? 11 : 10, strong ? bold : reg); y -= strong ? 18 : 15; };
  row("Subtotal", rs(o.subtotalPaise));
  if (o.discountPaise > 0) row("Discount", `- ${rs(o.discountPaise)}`);
  row("Shipping", o.shippingPaise === 0 ? "FREE" : rs(o.shippingPaise));
  if (o.codFeePaise > 0) row("COD fee", rs(o.codFeePaise));
  page.drawLine({ start: { x: 360, y: y + 10 }, end: { x: W - M, y: y + 10 }, thickness: 1, color: NAVY });
  row(o.paymentMethod === "cod" ? "Total (pay on delivery)" : "Total", rs(o.totalPaise), true);
  text("All prices are inclusive of applicable taxes.", M, y + 2, 8.5, reg, GREY);

  // Footer
  const foot = `Questions? ${seller.email} - 7-day easy returns. Thank you for shopping with CULTRAVEN.`;
  page.drawLine({ start: { x: M, y: 52 }, end: { x: W - M, y: 52 }, thickness: 0.5, color: LINE });
  text(foot, M, 38, 8.5, reg, GREY);
  text("This is a computer-generated receipt.", M, 27, 8, reg, GREY);

  pdf.setTitle(`CULTRAVEN receipt ${no}`);
  pdf.setProducer("CULTRAVEN");
  return pdf.save();
}
