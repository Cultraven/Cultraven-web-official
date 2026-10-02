import { describe, it, expect } from "vitest";
import { customerOrderEmail, adminOrderEmail, orderStatusEmail, adminCustomerActionEmail, escapeHtml, orderNumber, inr, type MailOrder } from "./email-templates";

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

  it("cancellation email is warm, explains the refund, links the wishlist and lists picks", () => {
    const m = orderStatusEmail(order, "https://cultraven.com", { status: "cancelled", note: "Ordered by mistake", picks: [{ title: "Raven Tee <b>", pricePaise: 149900, image: "https://x.test/a.jpg", url: "https://cultraven.com/products/raven-tee" }] });
    expect(m.subject).toContain("Cancelled");
    expect(m.html).toContain("sorry to see this one go");
    expect(m.html).toContain("Wishing you a great day");
    expect(m.html).toContain("/account/wishlist");
    expect(m.html).toContain("PICKS FOR YOU");
    expect(m.html).toContain("Raven Tee &lt;b&gt;");
    expect(m.html).toContain("nothing to refund");
    expect(m.html).not.toContain("Raven Tee <b>");
  });
  it("online-paid cancellation mentions the 5–7 day refund", () => {
    const m = orderStatusEmail({ ...order, paymentMethod: "razorpay", paymentStatus: "paid" }, "https://cultraven.com", { status: "cancelled" });
    expect(m.html).toContain("5–7 business days");
  });
  it("cancel-request emails: customer ack + admin alert", () => {
    const c = orderStatusEmail(order, "https://cultraven.com", { status: "cancel_requested", note: "Too slow" });
    expect(c.subject).toContain("Cancellation requested");
    expect(c.html).toContain("already shipped");
    const a = adminCustomerActionEmail(order, "https://cultraven.com", "cancel_requested", "Too slow");
    expect(a.subject).toContain("Cancellation requested");
    expect(a.html).toContain("already shipped");
    expect(a.html).toContain("/portal-secure/orders/");
  });
});
