import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildInvoicePdf, safeText, rs } from "./invoice-pdf";
import type { MailOrder } from "./email-templates";

const base: MailOrder = {
  id: "64b0000000000000000abc12", createdAt: new Date("2026-10-01"), paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Cargo — Military Olive", size: "XL", color: "Olive", quantity: 2, pricePaise: 249900 }],
  subtotalPaise: 499800, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 504700,
  deliveryAddress: { name: "Aarav Sharma", email: "a@x.com", phone: "9999999999", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};

describe("invoice pdf", () => {
  it("formats rupees without the unsupported ₹ glyph", () => expect(rs(249900)).toBe("Rs. 2,499"));
  it("replaces characters the font cannot draw", async () => {
    const pdf = await PDFDocument.create();
    const f = await pdf.embedFont(StandardFonts.Helvetica);
    expect(safeText(f, "Ravi कुमार 😀 ₹5")).toBe("Ravi ????? ? ?5");
  });
  it("builds a valid PDF for a normal order", async () => {
    const bytes = await buildInvoicePdf(base);
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
  it("survives Hindi/emoji names, a long title and 40 items (multi-page) without throwing", async () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ title: `Item ${i} ` + "very long product title ".repeat(8), size: "M", color: "Ñandú", quantity: 1, pricePaise: 100000 }));
    const bytes = await buildInvoicePdf({ ...base, items, discountPaise: 5000, paymentMethod: "razorpay", paymentStatus: "paid", deliveryAddress: { ...base.deliveryAddress, name: "कुमार 😀", line2: "<script>x</script>" } });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });
});
