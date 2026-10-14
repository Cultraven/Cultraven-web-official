/**
 * Order receipt as a PDF (pdf-lib, pure JS — works on serverless). Used by the download button and attached to the
 * order confirmation email. The built-in Helvetica font has no ₹ glyph or non-Latin letters, so money is printed as
 * "Rs." and any character the font can't encode is replaced with "?" instead of crashing.
 *
 * Layout (the same order Amazon / Flipkart receipts use): brand header, a summary strip (order no., date, payment method and
 * status), who sold it and where it goes, the items, the price breakup with the amount in words, then a footer with the registered
 * business details and how to reach us.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { orderNumber } from "@/lib/email-templates";
import type { MailOrder } from "@/lib/email-templates";
import { BUSINESS, supportPhoneDisplay } from "@/lib/business";
import { emailLogoBytes } from "@/lib/email-logo";

export interface SellerInfo { name: string; address: string[]; gstin: string; email: string; phone: string }

export function sellerInfo(env: NodeJS.ProcessEnv = process.env): SellerInfo {
  return {
    // Defaults are the registered business details (lib/business.ts); the INVOICE_SELLER_* variables can still override them.
    name: env.INVOICE_SELLER_NAME || BUSINESS.sellerName,
    address: env.INVOICE_SELLER_ADDRESS ? env.INVOICE_SELLER_ADDRESS.split("|") : [...BUSINESS.addressLines],
    gstin: env.INVOICE_SELLER_GSTIN || BUSINESS.gstin,
    email: env.INVOICE_SELLER_EMAIL || BUSINESS.supportEmail,
    phone: env.INVOICE_SELLER_PHONE || supportPhoneDisplay(),
  };
}

const NAVY = rgb(0.09, 0.145, 0.329);
const GOLD = rgb(0.855, 0.698, 0.02);
const GREY = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.85, 0.82, 0.75);
const BONE = rgb(0.93, 0.89, 0.81);
const CREAM = rgb(0.98, 0.96, 0.92);
const GREEN = rgb(0.1, 0.43, 0.24);
const RED = rgb(0.7, 0.15, 0.12);

const cultravenHost = () => BUSINESS.website.replace(/^https?:\/\//, "");

export const rs = (paise: number) => `Rs. ${(paise / 100).toLocaleString("en-IN")}`;

// ── Amount in words (Indian system: thousand, lakh, crore) ───────────────────────────

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const underHundred = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`);
const underThousand = (n: number) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : "", n % 100 ? underHundred(n % 100) : ""].filter(Boolean).join(" ");

/** 504700 paise -> "Rupees Five Thousand Forty-Seven Only". */
export function rupeesInWords(paise: number): string {
  const n = Number(paise);
  const total = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  const rupees = Math.floor(total / 100), ps = total % 100;
  // Beyond ₹1,000 crore the words stop being useful (and no order is that large): print the figure instead of failing.
  if (rupees >= 10_000_000_000) return `Rupees ${rupees.toLocaleString("en-IN")} Only`;
  const parts = [
    [Math.floor(rupees / 10_000_000), "Crore"], [Math.floor((rupees % 10_000_000) / 100_000), "Lakh"], [Math.floor((rupees % 100_000) / 1000), "Thousand"],
  ].filter(([n]) => (n as number) > 0).map(([n, unit]) => `${underThousand(n as number)} ${unit}`);
  if (rupees % 1000) parts.push(underThousand(rupees % 1000));
  const rupeeWords = parts.join(" ");
  if (!rupees && !ps) return "Rupees Zero Only";
  if (!rupees) return `${underHundred(ps)} Paise Only`;
  return `Rupees ${rupeeWords}${ps ? ` and ${underHundred(ps)} Paise` : ""} Only`;
}

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

/** How the payment reads on the receipt: the method, the status word, and the colour of that word. */
export function paymentSummary(o: Pick<MailOrder, "paymentMethod" | "paymentStatus">): { method: string; status: string; tone: "good" | "due" | "bad" } {
  const method = o.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)";
  switch (o.paymentStatus) {
    case "paid": return { method, status: "PAID", tone: "good" };
    case "refunded": return { method, status: "REFUNDED", tone: "good" };
    case "refund_pending": return { method, status: "REFUND PENDING", tone: "due" };
    case "failed": return { method, status: "FAILED", tone: "bad" };
    default: return { method, status: o.paymentMethod === "cod" ? "DUE ON DELIVERY" : "PENDING", tone: "due" };
  }
}

/** "9456782310" -> "+91 94567 82310" (anything that is not a 10-digit Indian mobile is printed as typed). */
export const prettyPhone = (p: string) => { const d = String(p ?? "").replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, ""); return /^\d{10}$/.test(d) ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : String(p ?? ""); };

const dateIST = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export async function buildInvoicePdf(o: MailOrder & { razorpayPaymentId?: string }, seller: SellerInfo = sellerInfo()): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(emailLogoBytes());
  const W = 595.28, H = 841.89, M = 44;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (s: string, x: number, yy: number, size = 10, font = reg, color = NAVY) => page.drawText(safeText(font, s), { x, y: yy, size, font, color });
  const right = (s: string, xr: number, yy: number, size = 10, font = reg, color = NAVY) => { const t = safeText(font, s); page.drawText(t, { x: xr - font.widthOfTextAtSize(t, size), y: yy, size, font, color }); };
  const drawLogo = (x: number, yy: number, width: number) => page.drawImage(logo, { x, y: yy, width, height: (width * logo.height) / logo.width });

  // Header band
  page.drawRectangle({ x: 0, y: H - 78, width: W, height: 78, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 82, width: W, height: 4, color: GOLD });
  drawLogo(M, H - 54, 150);
  text("Premium oversized streetwear", M, H - 67, 8.5, reg, LINE);
  right("ORDER RECEIPT", W - M, H - 44, 12, bold, CREAM);
  right(cultravenHost(), W - M, H - 61, 8.5, reg, LINE);
  y = H - 108;

  // Summary strip: the four facts people look for first
  const no = orderNumber(o.id);
  const pay = paymentSummary(o);
  const toneColor = pay.tone === "good" ? GREEN : pay.tone === "bad" ? RED : NAVY;
  page.drawRectangle({ x: M - 4, y: y - 22, width: W - 2 * M + 8, height: 38, color: BONE });
  const cells: [string, string, ReturnType<typeof rgb>][] = [["ORDER NO.", no, NAVY], ["ORDER DATE", dateIST(o.createdAt), NAVY], ["PAYMENT METHOD", pay.method, NAVY], ["PAYMENT STATUS", pay.status, toneColor]];
  const cellX = [M + 4, M + 124, M + 244, M + 386];
  cells.forEach(([label, value, color], i) => { text(label, cellX[i], y + 4, 7.5, bold, GREY); text(value, cellX[i], y - 11, 10.5, bold, color); });
  y -= 48;

  // Sold by / Delivered to
  const a = o.deliveryAddress;
  const colR = W / 2 + 10;
  text("SOLD BY", M, y, 8, bold, GREY);
  text("DELIVERED TO", colR, y, 8, bold, GREY);
  y -= 13;
  let sy = y;
  text(seller.name, M, sy, 10, bold); sy -= 13;
  for (const l of seller.address) { text(l, M, sy, 9.5); sy -= 12; }
  text(`GSTIN: ${seller.gstin}`, M, sy, 9.5, bold); sy -= 12;
  text(`Phone: ${seller.phone}`, M, sy, 9, reg, GREY); sy -= 11;
  text(seller.email, M, sy, 9, reg, GREY); sy -= 11;
  let ay = y;
  const addrLines = [a.name, a.line1, a.line2 ?? "", `${a.city}, ${a.state} ${a.pincode}`, `Phone: ${prettyPhone(a.phone)}`, a.email ? `Email: ${a.email}` : ""].filter(Boolean);
  addrLines.forEach((l, i) => { for (const w of wrap(i === 0 ? bold : reg, l, i === 0 ? 10 : 9.5, W - M - colR)) { text(w, colR, ay, i === 0 ? 10 : 9.5, i === 0 ? bold : reg); ay -= 12.5; } });
  y = Math.min(sy, ay) - 14;

  // Items table
  const col = { no: M, item: M + 20, qty: 360, unit: 440, amt: W - M };
  const tableHead = () => {
    page.drawRectangle({ x: M - 4, y: y - 5, width: W - 2 * M + 8, height: 20, color: BONE });
    text("#", col.no, y, 9, bold); text("ITEM", col.item, y, 9, bold); right("QTY", col.qty + 20, y, 9, bold); right("UNIT PRICE", col.unit + 36, y, 9, bold); right("AMOUNT", col.amt, y, 9, bold);
    y -= 22;
  };
  /** A continuation page: a slim branded header (and the column titles again while the items continue). */
  const newPage = (withTableHead: boolean) => {
    page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: NAVY });
    page.drawRectangle({ x: 0, y: H - 37, width: W, height: 3, color: GOLD });
    drawLogo(M, H - 27, 92);
    right(`Order ${no} (continued)`, W - M, H - 22, 9.5, reg, CREAM);
    y = H - 64;
    if (withTableHead) tableHead();
  };
  tableHead();
  o.items.forEach((it, idx) => {
    if (y < 160) newPage(true);
    const lines = wrap(reg, it.title, 10, 270);
    const sub = [it.size && `Size: ${it.size}`, it.color && `Colour: ${it.color}`].filter(Boolean).join("   ");
    text(String(idx + 1), col.no, y, 9.5, reg, GREY);
    lines.forEach((l, i) => text(l, col.item, y - i * 12, 10, i === 0 ? bold : reg));
    if (sub) text(sub, col.item, y - lines.length * 12, 8.5, reg, GREY);
    right(String(it.quantity), col.qty + 20, y, 10); right(rs(it.pricePaise), col.unit + 36, y, 10); right(rs(it.pricePaise * it.quantity), col.amt, y, 10);
    y -= lines.length * 12 + (sub ? 12 : 0) + 8;
    page.drawLine({ start: { x: M, y: y + 12 }, end: { x: W - M, y: y + 12 }, thickness: 0.5, color: LINE }); // between this row and the next, never through the next row's text
  });

  // Totals (right) and the notes that go with them (left)
  if (y < 270) newPage(false); // room for the totals, the notes beside them and the footer
  y -= 8;
  const top = y;
  const row = (k: string, v: string, strong = false) => { text(k, 360, y, strong ? 11 : 10, strong ? bold : reg); right(v, W - M, y, strong ? 11 : 10, strong ? bold : reg); y -= strong ? 18 : 15; };
  row("Subtotal", rs(o.subtotalPaise));
  if (o.discountPaise > 0) row("Discount", `- ${rs(o.discountPaise)}`);
  row("Shipping", o.shippingPaise === 0 ? "FREE" : rs(o.shippingPaise));
  if (o.codFeePaise > 0) row("COD fee", rs(o.codFeePaise));
  page.drawLine({ start: { x: 360, y: y + 10 }, end: { x: W - M, y: y + 10 }, thickness: 1, color: NAVY });
  row(o.paymentMethod === "cod" && o.paymentStatus !== "paid" ? "Total (pay on delivery)" : "Total", rs(o.totalPaise), true);

  let ny = top;
  const note = (label: string, body: string, color = NAVY) => {
    text(label, M, ny, 8, bold, GREY); ny -= 11;
    for (const l of wrap(reg, body, 9.5, 290)) { text(l, M, ny, 9.5, reg, color); ny -= 12; }
    ny -= 5;
  };
  note("AMOUNT IN WORDS", rupeesInWords(o.totalPaise));
  if (o.paymentMethod === "cod" && o.paymentStatus === "pending") note("PAYMENT", `Please pay ${rs(o.totalPaise)} in cash to the delivery partner when your order arrives.`);
  else if (o.razorpayPaymentId) note("PAYMENT ID", o.razorpayPaymentId);
  if (o.discountPaise > 0) note("YOU SAVED", `${rs(o.discountPaise)} on this order`, GREEN);
  y = Math.min(y, ny);
  text("All prices are inclusive of applicable taxes.", M, y + 2, 8.5, reg, GREY);

  // Footer: who sold it, how to reach us, and the policy in one line
  const identity = wrap(reg, `${seller.name}  |  ${seller.address.join(", ")}  |  GSTIN ${seller.gstin}`, 8.5, W - 2 * M);
  const footLines: { t: string; font: PDFFont; size: number; color: ReturnType<typeof rgb> }[] = [
    { t: "Thank you for shopping with CULTRAVEN.", font: bold, size: 9.5, color: NAVY },
    ...identity.map((t) => ({ t, font: reg, size: 8.5, color: GREY })),
    { t: `Need help? Call or WhatsApp ${seller.phone}  |  ${seller.email}  |  ${cultravenHost()}`, font: reg, size: 8.5, color: GREY },
    { t: "7-day easy returns on eligible items. Track your order any time under My Account > Orders.", font: reg, size: 8.5, color: GREY },
    { t: "This is a computer-generated receipt and does not require a signature.", font: reg, size: 8, color: GREY },
  ];
  const footTop = 34 + footLines.length * 12;
  page.drawLine({ start: { x: M, y: footTop + 6 }, end: { x: W - M, y: footTop + 6 }, thickness: 0.5, color: LINE });
  footLines.forEach((l, i) => text(l.t, M, footTop - 6 - i * 12, l.size, l.font, l.color));

  // Page numbers (only when the receipt runs to more than one page)
  const pages = pdf.getPages();
  if (pages.length > 1) pages.forEach((p, i) => { const t = `Page ${i + 1} of ${pages.length}`; p.drawText(t, { x: W - M - reg.widthOfTextAtSize(t, 8), y: 20, size: 8, font: reg, color: GREY }); });

  pdf.setTitle(`CULTRAVEN receipt ${no}`);
  pdf.setProducer("CULTRAVEN");
  return pdf.save();
}
