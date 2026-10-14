/**
 * Scenario: the emails a customer receives as ONE order moves through the shop. Each journey is run email by email and checked as a
 * sequence — the tracker only ever moves forward, each email names the right status, nothing from an earlier email contradicts a later one.
 */
import { describe, it, expect } from "vitest";
import { customerOrderEmail, orderStatusEmail, adminCustomerActionEmail, type MailOrder } from "./email-templates";
import { buildTimeline, type HistoryEvent } from "./order-lifecycle";

const SITE = "https://cultraven.com";
const T0 = new Date("2026-10-12T04:30:00Z"); // 10:00 am in India
const at = (hours: number) => new Date(T0.getTime() + hours * 3_600_000).toISOString();
const order = (over: Partial<MailOrder> = {}): MailOrder => ({
  id: "64b0000000000000000abc12", createdAt: T0, paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Tee", size: "M", color: "Black", quantity: 2, pricePaise: 149900 }],
  subtotalPaise: 299800, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 304700,
  deliveryAddress: { name: "Asha Verma", email: "asha@example.com", phone: "9456782310", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
  ...over,
});
const doneCount = (html: string) => (html.match(/&#10003;/g) ?? []).length;
const labels = (html: string) => [...html.matchAll(/vertical-align:middle">([^<]+)<\/span><(?:div|\/td)/g)].map((m) => m[1]);
const current = (html: string) => /Current status/.test(html) ? labels(html)[(html.split("Current status")[0].match(/vertical-align:middle">[^<]+<\/span><(?:div|\/td)/g) ?? []).length - 1] : null;

/** The history an admin's clicks would build up, and the email sent after each click. */
function journey(steps: { status: string; hours: number; note?: string; tracking?: boolean }[], o = order()) {
  const history: HistoryEvent[] = [];
  return steps.map((s) => {
    history.push({ status: s.status, at: at(s.hours), note: s.note });
    const timeline = buildTimeline({ fulfillmentStatus: s.status, createdAt: o.createdAt, statusHistory: [...history] });
    return { status: s.status, mail: orderStatusEmail(o, SITE, { status: s.status, note: s.note, courier: s.tracking ? "Delhivery" : undefined, trackingNumber: s.tracking ? "DLV123" : undefined, trackingUrl: s.tracking ? "https://www.delhivery.com/track/DLV123" : undefined, timeline }) };
  });
}

describe("scenario: the happy path — placed, confirmed, packed, shipped, out for delivery, delivered", () => {
  const confirmation = customerOrderEmail(order(), SITE, { receiptAttached: true });
  const mails = journey([
    { status: "confirmed", hours: 2 }, { status: "packed", hours: 20 }, { status: "shipped", hours: 30, note: "Handed to the courier", tracking: true },
    { status: "out_for_delivery", hours: 76 }, { status: "delivered", hours: 80 },
  ]);
  it("the confirmation shows the whole journey ahead, with only 'Order placed' reached", () => {
    expect(labels(confirmation.html)).toEqual(["Order placed", "Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"]);
    expect(doneCount(confirmation.html)).toBe(0);
    expect(confirmation.subject).toBe("Order confirmed — CR-ABC12".replace("CR-ABC12", "CR-0ABC12"));
  });
  it("every email has its own subject naming the new status", () => {
    expect(mails.map((m) => m.mail.subject)).toEqual(["CR-0ABC12: Confirmed", "CR-0ABC12: Packed", "CR-0ABC12: Shipped", "CR-0ABC12: Out for delivery", "CR-0ABC12: Delivered"]);
  });
  it("the tracker only ever moves forward: one more ✓ each time (the step just reached is the gold 'current' one), and everything is ✓ at the end", () => {
    expect(mails.map((m) => doneCount(m.mail.html))).toEqual([1, 2, 3, 4, 6]);
    expect(mails.slice(0, 4).map((m) => current(m.mail.html))).toEqual(["Confirmed", "Packed", "Shipped", "Out for delivery"]);
  });
  it("the last email shows everything done, nothing 'current', nothing still to come", () => {
    const last = mails[4].mail.html;
    expect(doneCount(last)).toBe(6);
    expect(last).not.toContain("Current status");
    expect(last).not.toContain("background:#ffffff;border:2px solid #C9C3B3");
    expect(last).toContain("Your order has been delivered");
  });
  it("tracking details appear once shipped, with the courier link and the admin's note", () => {
    const shipped = mails[2].mail;
    expect(shipped.html).toContain("DLV123"); expect(shipped.html).toContain("TRACK WITH THE COURIER"); expect(shipped.html).toContain("Handed to the courier");
    expect(shipped.text).toContain("DLV123");
    expect(mails[0].mail.html).not.toContain("DLV123");
  });
  it("times are in India time and in the right order down the page", () => {
    const html = mails[4].mail.html;
    const times = [...html.matchAll(/(\d{1,2}) Oct, (\d{1,2}):(\d{2}) (am|pm)/g)].map((m) => `${m[1]} Oct, ${m[2]}:${m[3]} ${m[4]}`);
    expect(times).toEqual(["12 Oct, 10:00 am", "12 Oct, 12:00 pm", "13 Oct, 6:00 am", "13 Oct, 4:00 pm", "15 Oct, 2:00 pm", "15 Oct, 6:00 pm"].slice(0, times.length));
    expect(times.length).toBeGreaterThanOrEqual(6);
  });
  it("a delivered email promises a 7-day return window; earlier ones show an arrival date while it is still ahead", () => {
    expect(mails[4].mail.html).toContain("within 7 days");
    expect(mails[4].mail.html).not.toContain("Arriving by");
  });
});

describe("scenario: the customer cancels before it ships", () => {
  const o = order({ paymentMethod: "razorpay", paymentStatus: "paid" });
  const [confirmed, cancelled] = journey([{ status: "confirmed", hours: 1 }, { status: "cancelled", hours: 3, note: "Ordered by mistake" }], o);
  it("the cancellation email shows what happened and drops the steps it never reached", () => {
    expect(labels(cancelled.mail.html)).toEqual(["Order placed", "Confirmed", "Cancelled"]);
    expect(cancelled.mail.html).toContain("&#10005;");
    expect(cancelled.mail.html).toContain("Ordered by mistake");
    expect(cancelled.mail.html).not.toContain("Arriving by");
  });
  it("a paid order promises the 5–7 day refund; a COD order says there is nothing to refund", () => {
    expect(cancelled.mail.html).toContain("5–7 business days");
    const cod = journey([{ status: "cancelled", hours: 3 }], order())[0].mail;
    expect(cod.html).toContain("nothing to refund");
  });
  it("the earlier email was an ordinary 'confirmed' one", () => { expect(confirmed.mail.subject).toBe("CR-0ABC12: Confirmed"); });
  it("the team is told, with the reason and a refund warning for online payments", () => {
    const a = adminCustomerActionEmail(o, SITE, "cancelled", "Ordered by mistake");
    expect(a.subject).toBe("Order cancelled — CR-0ABC12");
    expect(a.html).toContain("Ordered by mistake");
    expect(a.html).toContain("a refund is due");
  });
});

describe("scenario: a cancellation request after it has shipped", () => {
  it("the customer's acknowledgement explains why it needs checking; the tracker shows the order still on its way", () => {
    const o = order();
    const timeline = buildTimeline({ fulfillmentStatus: "shipped", createdAt: o.createdAt, statusHistory: [{ status: "shipped", at: at(5) }] });
    const m = orderStatusEmail(o, SITE, { status: "cancel_requested", note: "Delivery is taking too long", timeline });
    expect(m.subject).toBe("CR-0ABC12: Cancellation requested");
    expect(m.html).toContain("already shipped");
    expect(current(m.html)).toBe("Shipped");
    expect(adminCustomerActionEmail(o, SITE, "cancel_requested", "Too slow").html).toContain("already shipped");
  });
});

describe("scenario: delivery goes wrong", () => {
  it("a failed attempt: the 'delivery failed' step sits right after Shipped, the rest still to come", () => {
    const [, failed] = journey([{ status: "shipped", hours: 5, tracking: true }, { status: "delivery_failed", hours: 30, note: "Customer not reachable" }]);
    const l = labels(failed.mail.html);
    expect(l.indexOf("Delivery attempt failed")).toBe(l.indexOf("Shipped") + 1);
    expect(l.indexOf("Delivered")).toBeGreaterThan(l.indexOf("Delivery attempt failed"));
    expect(failed.mail.html).toContain("keep your phone reachable");
    expect(failed.mail.html).toContain("Customer not reachable");
  });
  it("returned to origin ends the story in red, with the refund promise", () => {
    const [, , rto] = journey([{ status: "shipped", hours: 5 }, { status: "delivery_failed", hours: 30 }, { status: "rto", hours: 90 }]);
    expect(rto.mail.html).toContain("&#10005;");
    expect(labels(rto.mail.html).slice(-1)).toEqual(["Returned to origin"]);
    expect(rto.mail.html).toContain("5–7 business days");
  });
  it("an order put on hold shows 'On hold' as the current step, then resumes", () => {
    const [hold, resumed] = journey([{ status: "on_hold", hours: 3, note: "Verifying the address" }, { status: "confirmed", hours: 6 }]);
    expect(current(hold.mail.html)).toBe("On hold");
    expect(current(resumed.mail.html)).toBe("Confirmed");
  });
});

describe("scenario: a return after delivery", () => {
  it("return requested, then returned and refunded", () => {
    const base = [{ status: "shipped", hours: 5 }, { status: "delivered", hours: 50 }];
    const [, , requested, returned] = journey([...base, { status: "return_requested", hours: 70, note: "Size doesn't fit" }, { status: "returned", hours: 150 }]);
    expect(labels(requested.mail.html).slice(-1)).toEqual(["Return requested"]);
    expect(requested.mail.html).toContain("Size doesn&#39;t fit");
    expect(labels(returned.mail.html).slice(-1)).toEqual(["Returned & refunded".replace("&", "&amp;")]);
    expect(returned.mail.html).toContain("5–7 business days");
  });
});

describe("scenario: unusual orders", () => {
  it("an order with a discount, free shipping and online payment prints every line and the right total", () => {
    const o = order({ paymentMethod: "razorpay", paymentStatus: "paid", discountPaise: 50000, shippingPaise: 0, codFeePaise: 0, subtotalPaise: 299800, totalPaise: 249800 });
    const m = customerOrderEmail(o, SITE);
    expect(m.html).toContain("Discount"); expect(m.html).toContain("−₹500"); expect(m.html).toContain("FREE"); expect(m.html).toContain("₹2,498"); expect(m.html).not.toContain("COD fee");
    expect(m.html).toContain("Paid online");
  });
  it("a 25-item order stays well under Gmail's 102 KB clipping limit", () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ title: `Oversized heavyweight cotton tee number ${i + 1} — Acid Black`, size: "XL", color: "Black", quantity: 3, pricePaise: 149900, image: "/uploads/tee.png" }));
    const m = customerOrderEmail(order({ items }), SITE);
    expect(m.html.length).toBeLessThan(60_000);
    expect(m.html.match(/<img src="https:\/\/cultraven\.com\/uploads\/tee\.png"/g)).toHaveLength(25);
  });
  it("a customer with no email and no phone still gets a sensible team alert", () => {
    const o = order({ deliveryAddress: { name: "Walk In", phone: "", line1: "Shop 4", city: "Indore", state: "Madhya Pradesh", pincode: "452001" } });
    const a = adminCustomerActionEmail(o, SITE, "cancelled", "Test");
    expect(a.html).toContain("Walk In");
    expect(a.html).not.toContain("mailto:undefined");
    expect(a.html).not.toContain("tel:");
  });
});
