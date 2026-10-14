import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildInvoicePdf, safeText, rs, rupeesInWords, paymentSummary, prettyPhone, sellerInfo } from "./invoice-pdf";
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

describe("receipt wording", () => {
  it("writes the amount in words the Indian way (thousand, lakh, crore)", () => {
    expect(rupeesInWords(504700)).toBe("Rupees Five Thousand Forty-Seven Only");
    expect(rupeesInWords(654600)).toBe("Rupees Six Thousand Five Hundred Forty-Six Only");
    expect(rupeesInWords(100)).toBe("Rupees One Only");
    expect(rupeesInWords(1_00_00_000 * 100)).toBe("Rupees One Crore Only");
    expect(rupeesInWords(12_34_56_789 * 100)).toBe("Rupees Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine Only");
    expect(rupeesInWords(150000 * 100)).toBe("Rupees One Lakh Fifty Thousand Only");
    expect(rupeesInWords(5050)).toBe("Rupees Fifty and Fifty Paise Only");
    expect(rupeesInWords(50)).toBe("Fifty Paise Only");
    expect(rupeesInWords(0)).toBe("Rupees Zero Only");
    expect(rupeesInWords(Number.NaN)).toBe("Rupees Zero Only");
  });
  it("says how the payment stands: paid, due on delivery, refunded, failed", () => {
    expect(paymentSummary({ paymentMethod: "cod", paymentStatus: "pending" })).toEqual({ method: "Cash on Delivery", status: "DUE ON DELIVERY", tone: "due" });
    expect(paymentSummary({ paymentMethod: "cod", paymentStatus: "paid" })).toMatchObject({ status: "PAID", tone: "good" });
    expect(paymentSummary({ paymentMethod: "razorpay", paymentStatus: "paid" })).toEqual({ method: "Online (Razorpay)", status: "PAID", tone: "good" });
    expect(paymentSummary({ paymentMethod: "razorpay", paymentStatus: "pending" })).toMatchObject({ status: "PENDING", tone: "due" });
    expect(paymentSummary({ paymentMethod: "razorpay", paymentStatus: "refunded" }).status).toBe("REFUNDED");
    expect(paymentSummary({ paymentMethod: "razorpay", paymentStatus: "failed" })).toMatchObject({ status: "FAILED", tone: "bad" });
  });
  it("prints Indian mobile numbers as +91 xxxxx xxxxx", () => {
    expect(prettyPhone("9456782310")).toBe("+91 94567 82310");
    expect(prettyPhone("+91 94567-82310")).toBe("+91 94567 82310");
    expect(prettyPhone("09456782310")).toBe("+91 94567 82310");
    expect(prettyPhone("12345")).toBe("12345");
  });
  it("the seller block carries the registered phone (8962212605) and can be overridden", () => {
    expect(sellerInfo({} as any).phone).toBe("+91 89622 12605");
    expect(sellerInfo({ INVOICE_SELLER_PHONE: "+91 99999 00000" } as any).phone).toBe("+91 99999 00000");
  });
  it("a COD receipt, a paid receipt with a discount and a refunded one all build", async () => {
    for (const o of [base, { ...base, paymentMethod: "razorpay" as const, paymentStatus: "paid", discountPaise: 50000, razorpayPaymentId: "pay_ABC123" }, { ...base, paymentMethod: "razorpay" as const, paymentStatus: "refunded" }]) {
      const bytes = await buildInvoicePdf(o);
      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
      expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    }
  });
});
