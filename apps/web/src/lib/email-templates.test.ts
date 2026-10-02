import { describe, it, expect } from "vitest";
import { customerOrderEmail, adminOrderEmail, escapeHtml, orderNumber, inr, type MailOrder } from "./email-templates";

const order: MailOrder = {
  id: "64b0000000000000000abc12",
  createdAt: new Date(),
  paymentMethod: "cod",
  paymentStatus: "pending",
  items: [{ title: 'Tee <script>alert("x")</script>', size: "M", color: "Black", quantity: 2, pricePaise: 149900 }],
  subtotalPaise: 299800, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 304700,
  deliveryAddress: { name: "Aarav Sharma", email: "a@x.com", phone: "9999999999", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};

describe("email templates", () => {
  it("formats numbers", () => { expect(orderNumber(order.id)).toBe("CR-0ABC12"); expect(inr(304700)).toBe("₹3,047"); });
  it("escapes HTML", () => expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;"));
  it("customer email has number, address, COD amount and no raw HTML injection", () => {
    const m = customerOrderEmail(order, "https://cultraven.com");
    expect(m.subject).toContain("CR-0ABC12");
    expect(m.html).toContain("Cash on Delivery");
    expect(m.html).toContain("₹3,047");
    expect(m.html).toContain("411001");
    expect(m.html).not.toContain("<script>");
    expect(m.text).toContain("TOTAL: ₹3,047");
  });
  it("admin email flags COD and links to the admin order", () => {
    const m = adminOrderEmail(order, "https://cultraven.com");
    expect(m.subject).toContain("(COD)");
    expect(m.html).toContain("/portal-secure/orders/64b0000000000000000abc12");
    expect(m.html).toContain("Confirm the COD order");
  });
});
