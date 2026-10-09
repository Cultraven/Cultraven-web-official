/**
 * Order exports for the admin Orders page: one row shape, used for both the Excel (.xlsx) file and the PDF report.
 * Money is in rupees (numbers, so Excel can add them up); the PDF prints it as "Rs." because the built-in PDF font has no ₹.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { buildXlsx, type XlsxColumn } from "./xlsx-lite";
import { STATUS_LABEL, isOrderStatus } from "./order-lifecycle";
import { orderNumber } from "./email-templates";
import { safeText } from "./invoice-pdf";

export interface OrderExportRow {
  orderNo: string; orderId: string; placedAt: string; customer: string; email: string; phone: string;
  address: string; city: string; state: string; pincode: string;
  items: string; units: number;
  subtotal: number; discount: number; shipping: number; codFee: number; total: number;
  payment: string; paymentStatus: string; status: string; statusKey: string;
  courier: string; tracking: string; deliveredAt: string;
}

const IST = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
const fmtDate = (d: unknown) => (d ? IST.format(new Date(d as string | number | Date)) : "");
const rupees = (paise: unknown) => Math.round(Number(paise) || 0) / 100;
const cap = (s: unknown) => { const t = String(s ?? "").replace(/_/g, " "); return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; };

/** Flattens a stored order into one export row. */
export function toExportRow(o: any): OrderExportRow {
  const a = o.deliveryAddress ?? {};
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  const key = String(o.fulfillmentStatus ?? "processing");
  return {
    orderNo: orderNumber(String(o._id)),
    orderId: String(o._id),
    placedAt: fmtDate(o.createdAt),
    customer: a.name ?? "",
    email: a.email ?? "",
    phone: a.phone ?? "",
    address: [a.line1, a.line2].filter(Boolean).join(", "),
    city: a.city ?? "",
    state: a.state ?? "",
    pincode: a.pincode ?? "",
    items: items.map((i) => `${i.quantity ?? 1}× ${i.title ?? "Item"}${[i.size, i.color].filter(Boolean).length ? ` (${[i.size, i.color].filter(Boolean).join(", ")})` : ""}`).join("; "),
    units: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    subtotal: rupees(o.subtotalPaise ?? items.reduce((s, i) => s + (Number(i.pricePaise) || 0) * (Number(i.quantity) || 0), 0)),
    discount: rupees(o.discountPaise),
    shipping: rupees(o.shippingPaise),
    codFee: rupees(o.codFeePaise),
    total: rupees(o.totalPaise),
    payment: o.paymentMethod === "cod" ? "Cash on Delivery" : o.paymentMethod ? "Online" : "",
    paymentStatus: cap(o.paymentStatus),
    status: isOrderStatus(key) ? STATUS_LABEL[key] : cap(key),
    statusKey: key,
    courier: o.courierName ?? "",
    tracking: o.trackingNumber ?? "",
    deliveredAt: fmtDate(o.deliveredAt),
  };
}

/** Orders that no longer represent money coming in. */
const NOT_REVENUE = new Set(["cancelled", "returned", "rto"]);
export const totals = (rows: OrderExportRow[]) => ({
  count: rows.length,
  all: rows.reduce((s, r) => s + r.total, 0),
  live: rows.filter((r) => !NOT_REVENUE.has(r.statusKey)).reduce((s, r) => s + r.total, 0),
});

const COLUMNS: (XlsxColumn & { get: (r: OrderExportRow) => string | number })[] = [
  { header: "Order no.", width: 13, get: (r) => r.orderNo },
  { header: "Placed on", width: 21, get: (r) => r.placedAt },
  { header: "Status", width: 18, get: (r) => r.status },
  { header: "Customer", width: 22, get: (r) => r.customer },
  { header: "Email", width: 28, get: (r) => r.email },
  { header: "Phone", width: 14, get: (r) => r.phone },
  { header: "Address", width: 38, get: (r) => r.address },
  { header: "City", width: 16, get: (r) => r.city },
  { header: "State", width: 18, get: (r) => r.state },
  { header: "Pincode", width: 10, get: (r) => r.pincode },
  { header: "Items", width: 52, get: (r) => r.items },
  { header: "Units", width: 8, kind: "int", get: (r) => r.units },
  { header: "Subtotal (Rs.)", width: 14, kind: "money", get: (r) => r.subtotal },
  { header: "Discount (Rs.)", width: 14, kind: "money", get: (r) => r.discount },
  { header: "Shipping (Rs.)", width: 14, kind: "money", get: (r) => r.shipping },
  { header: "COD fee (Rs.)", width: 13, kind: "money", get: (r) => r.codFee },
  { header: "Total (Rs.)", width: 14, kind: "money", get: (r) => r.total },
  { header: "Payment", width: 18, get: (r) => r.payment },
  { header: "Payment status", width: 16, get: (r) => r.paymentStatus },
  { header: "Courier", width: 16, get: (r) => r.courier },
  { header: "Tracking no.", width: 18, get: (r) => r.tracking },
  { header: "Delivered on", width: 21, get: (r) => r.deliveredAt },
  { header: "Order ID", width: 26, get: (r) => r.orderId },
];

export function buildOrdersXlsx(rows: OrderExportRow[]): Buffer {
  return buildXlsx("Orders", COLUMNS, rows.map((r) => COLUMNS.map((c) => c.get(r))));
}

// ── PDF report ─────────────────────────────────────────────────────────────────────────────────────────────────────
const NAVY = rgb(0.09, 0.145, 0.329);
const GOLD = rgb(0.855, 0.698, 0.02);
const GREY = rgb(0.4, 0.4, 0.4);
const ZEBRA = rgb(0.965, 0.955, 0.93);
const W = 842, H = 595, MX = 28; // A4 landscape

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Cuts text with "…" (as "...") so it never runs into the next column. */
function fit(font: PDFFont, text: string, size: number, max: number): string {
  let s = safeText(font, text);
  if (font.widthOfTextAtSize(s, size) <= max) return s;
  while (s.length > 1 && font.widthOfTextAtSize(`${s}...`, size) > max) s = s.slice(0, -1);
  return `${s.trimEnd()}...`;
}

export async function buildOrdersPdf(rows: OrderExportRow[], scope: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("CULTRAVEN orders");
  pdf.setProducer("CULTRAVEN");
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const t = totals(rows);

  // [heading, width, align, value]
  const cols: [string, number, "l" | "r", (r: OrderExportRow) => string][] = [
    ["Order", 62, "l", (r) => r.orderNo],
    ["Placed on", 92, "l", (r) => r.placedAt.replace(",", "")],
    ["Customer", 150, "l", (r) => r.customer],
    ["Phone", 66, "l", (r) => r.phone],
    ["City", 82, "l", (r) => r.city],
    ["Items", 120, "l", (r) => r.items],
    ["Pay", 56, "l", (r) => (r.payment.startsWith("Cash") ? "COD" : r.payment)],
    ["Status", 92, "l", (r) => r.status],
    ["Total", 64, "r", (r) => money(r.total)],
  ];
  const widthSum = cols.reduce((s, c) => s + c[1], 0);
  const scale = (W - 2 * MX) / widthSum;
  const xs: number[] = [];
  { let x = MX; for (const c of cols) { xs.push(x); x += c[1] * scale; } }

  const ROW = 21, TOP = H - 86, BOTTOM = 46;
  const perPage = Math.floor((TOP - BOTTOM) / ROW);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));

  for (let p = 0; p < pages; p++) {
    const page: PDFPage = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: NAVY });
    page.drawRectangle({ x: 0, y: H - 9, width: W, height: 3, color: GOLD });
    page.drawText("CULTRAVEN", { x: MX, y: H - 36, size: 17, font: bold, color: NAVY });
    page.drawText("Orders report", { x: MX + 104, y: H - 35, size: 11, font: reg, color: GREY });
    const meta = `${safeText(reg, scope)}  |  ${t.count} order${t.count === 1 ? "" : "s"}  |  Total ${money(t.all)}  |  Excluding cancelled / returned: ${money(t.live)}`;
    page.drawText(fit(reg, meta, 8.5, W - 2 * MX), { x: MX, y: H - 54, size: 8.5, font: reg, color: GREY });

    // header row
    page.drawRectangle({ x: MX - 4, y: TOP - 4, width: W - 2 * MX + 8, height: 18, color: NAVY });
    cols.forEach((c, i) => {
      const w = c[1] * scale - 8;
      const label = c[0];
      const x = c[2] === "r" ? xs[i] + w - bold.widthOfTextAtSize(label, 8.5) : xs[i];
      page.drawText(label, { x, y: TOP + 1, size: 8.5, font: bold, color: rgb(1, 1, 1) });
    });

    rows.slice(p * perPage, (p + 1) * perPage).forEach((r, k) => {
      const y = TOP - 4 - (k + 1) * ROW + 6;
      if (k % 2 === 1) page.drawRectangle({ x: MX - 4, y: y - 6, width: W - 2 * MX + 8, height: ROW, color: ZEBRA });
      cols.forEach((c, i) => {
        const w = c[1] * scale - 8;
        const font = i === 0 || c[2] === "r" ? bold : reg;
        const text = fit(font, c[3](r), 8, w);
        const x = c[2] === "r" ? xs[i] + w - font.widthOfTextAtSize(text, 8) : xs[i];
        page.drawText(text, { x, y, size: 8, font, color: rgb(0.1, 0.1, 0.1) });
      });
    });

    page.drawText(`Page ${p + 1} of ${pages}`, { x: W - MX - 50, y: 22, size: 8, font: reg, color: GREY });
    page.drawText(`Generated ${safeText(reg, fmtDate(new Date()))} (IST)`, { x: MX, y: 22, size: 8, font: reg, color: GREY });
  }
  return pdf.save();
}
