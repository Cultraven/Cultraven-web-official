/** What the customer sees as their order moves: the vertical tracker, product photos, dates in India time, tidy contact links, the account emails. */
import { describe, it, expect } from "vitest";
import {
  customerOrderEmail, adminOrderEmail, orderStatusEmail, supportAdminEmail, passwordResetEmail, passwordChangedEmail, welcomeEmail, staffAccountCreatedEmail,
  istDate, istDateTime, estimatedDelivery, type MailOrder,
} from "./email-templates";
import { buildTimeline } from "./order-lifecycle";

const SITE = "https://cultraven.com";
const placed = new Date("2026-10-09T04:30:00Z"); // Fri 9 Oct 2026, 10:00 am in India
const order: MailOrder = {
  id: "64b0000000000000000abc12", createdAt: placed, paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Tee", size: "M", color: "Black", quantity: 2, pricePaise: 149900, image: "/uploads/raven.png" }],
  subtotalPaise: 299800, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 304700,
  deliveryAddress: { name: "Asha Verma", email: "asha@example.com", phone: "9456782310", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};
const hist = (pairs: [string, string][]) => pairs.map(([status, at]) => ({ status, at }));
const trackerRows = (html: string) => [...html.matchAll(/border-left:2px solid (#[0-9A-Fa-f]{6});padding:0 0 \d+px 26px/g)];
const labelsIn = (html: string) => [...html.matchAll(/vertical-align:middle">([^<]+)<\/span><(?:div|\/td)/g)].map((m) => m[1]);

describe("dates are shown in India time", () => {
  it("converts UTC to IST and names the zone", () => {
    expect(istDate(placed)).toBe("Fri, 9 Oct 2026");
    expect(istDateTime(new Date("2026-10-14T10:12:00Z"))).toBe("Wed, 14 Oct 2026, 3:42 pm IST");
    expect(istDateTime(new Date("2026-10-14T18:45:00Z"))).toBe("Thu, 15 Oct 2026, 12:15 am IST"); // past midnight in India
    expect(istDate("not a date")).toBe("");
  });
  it("delivery window is 3–5 days after the order, skipping Sundays", () => {
    const e = estimatedDelivery(placed)!;
    expect(istDate(e.from)).toBe("Tue, 13 Oct 2026"); // Sat(1) · Sun skipped · Mon(2) · Tue(3)
    expect(istDate(e.to)).toBe("Thu, 15 Oct 2026");
    expect(estimatedDelivery("garbage")).toBeNull();
  });
});

describe("order tracker (vertical)", () => {
  const shippedTimeline = buildTimeline({
    fulfillmentStatus: "shipped", createdAt: placed,
    statusHistory: hist([["confirmed", "2026-10-09T06:00:00Z"], ["packed", "2026-10-09T09:00:00Z"], ["shipped", "2026-10-10T05:00:00Z"]]),
  });
  const m = orderStatusEmail(order, SITE, { status: "shipped", courier: "Delhivery", trackingNumber: "DLV123", timeline: shippedTimeline });

  it("lists every stage top to bottom, one row each, in order", () => {
    expect(labelsIn(m.html)).toEqual(["Order placed", "Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"]);
    expect(trackerRows(m.html)).toHaveLength(6);
  });
  it("marks what is done (✓), where the order is now, and what is still to come", () => {
    expect(m.html.match(/&#10003;/g)?.length).toBe(3); // placed, confirmed, packed
    expect(m.html).toContain("Current status · 10 Oct, 10:30 am"); // Shipped, in India time
    expect(m.html).toContain("9 Oct, 10:00 am"); // the order-placed time
    expect(m.html).toContain("9 Oct, 11:30 am"); // confirmed
  });
  it("the line is solid navy up to the current step and grey after it", () => {
    const colours = trackerRows(m.html).map((r) => r[1]);
    expect(colours).toEqual(["#172554", "#172554", "#172554", "#D5D0C2", "#D5D0C2", "#FAF9F6"]);
  });
  it("is in the plain-text version too", () => {
    expect(m.text).toContain("[x] Order placed");
    expect(m.text).toContain("[>] Shipped");
    expect(m.text).toContain("[ ] Delivered");
  });
  it("courier details are laid out as rows with a courier link", () => {
    const withLink = orderStatusEmail(order, SITE, { status: "shipped", courier: "Delhivery", trackingNumber: "DLV123", trackingUrl: "https://www.delhivery.com/track/DLV123", timeline: shippedTimeline });
    expect(withLink.html).toContain("Delhivery");
    expect(withLink.html).toContain("DLV123");
    expect(withLink.html).toContain('href="https://www.delhivery.com/track/DLV123"');
    expect(withLink.html).toContain("TRACK WITH THE COURIER");
  });
  it("a cancelled order shows what happened and drops the steps it never reached", () => {
    const c = orderStatusEmail(order, SITE, { status: "cancelled", timeline: buildTimeline({ fulfillmentStatus: "cancelled", createdAt: placed, statusHistory: hist([["confirmed", "2026-10-09T06:00:00Z"], ["cancelled", "2026-10-09T07:00:00Z"]]) }) });
    expect(labelsIn(c.html)).toEqual(["Order placed", "Confirmed", "Cancelled"]);
    expect(c.html).toContain("&#10005;"); // the red ✕
  });
  it("on hold sits right after the last step that happened, not after the ones still to come", () => {
    const h = orderStatusEmail(order, SITE, { status: "on_hold", timeline: buildTimeline({ fulfillmentStatus: "on_hold", createdAt: placed, statusHistory: hist([["confirmed", "2026-10-09T06:00:00Z"], ["on_hold", "2026-10-09T08:00:00Z"]]) }) });
    expect(labelsIn(h.html)).toEqual(["Order placed", "Confirmed", "On hold", "Packed", "Shipped", "Out for delivery", "Delivered"]);
  });
  it("without a timeline it is worked out from the status; unknown statuses just skip the tracker", () => {
    expect(labelsIn(orderStatusEmail(order, SITE, { status: "packed" }).html)).toContain("Packed");
    expect(orderStatusEmail(order, SITE, { status: "mystery" }).html).not.toContain("Order tracker");
  });
  it("the confirmation email shows the whole journey ahead", () => {
    const c = customerOrderEmail(order, SITE);
    expect(labelsIn(c.html)).toEqual(["Order placed", "Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"]);
    expect(c.html).toContain("Where your order is");
  });
});

describe("order details", () => {
  it("shows the product photo, resolving the site's own upload path", () => {
    const c = customerOrderEmail(order, SITE);
    expect(c.html).toContain(`<img src="${SITE}/uploads/raven.png" alt="Raven Tee" width="60" height="60"`);
    expect(c.html).toContain("Size M · Black · Qty 2 · ₹1,499 each");
  });
  it("without photos the product column simply has no thumbnail cell", () => {
    const c = customerOrderEmail({ ...order, items: [{ ...order.items[0], image: undefined }] }, SITE);
    expect(c.html).not.toContain('width="60" height="60"');
    expect(c.html).not.toContain('<td width="72"');
  });
  it("refuses a photo address that could be anything else (data:, javascript:)", () => {
    const c = customerOrderEmail({ ...order, items: [{ ...order.items[0], image: "javascript:alert(1)" }] }, SITE);
    expect(c.html).not.toContain("javascript:");
    expect(customerOrderEmail({ ...order, items: [{ ...order.items[0], image: "data:image/png;base64,AAAA" }] }, SITE).html).not.toContain("data:image");
  });
  it("shows order number, placed date, payment and the delivery window as labelled rows", () => {
    const c = customerOrderEmail(order, SITE);
    expect(c.html).toContain("Fri, 9 Oct 2026");
    expect(c.html).toContain("Tue, 13 Oct – Thu, 15 Oct (3–5 business days)");
    expect(c.html).toContain("Cash on Delivery");
    expect(c.html).toContain("Inclusive of all applicable taxes");
    expect(c.text).toContain("Estimated delivery: Tue, 13 Oct – Thu, 15 Oct (3–5 business days)");
  });
});

describe("contact details are explicit, tidy links", () => {
  it("customer phone and email in the alerts are tap-to-call / mailto links in the brand colour (so Gmail doesn't add its own blue)", () => {
    const a = adminOrderEmail(order, SITE);
    expect(a.html).toContain('<a href="mailto:asha@example.com" style="color:#172554;text-decoration:underline">asha@example.com</a>');
    expect(a.html).toContain('<a href="tel:+919456782310" style="color:#172554;text-decoration:underline">+91 94567 82310</a>');
    const s = supportAdminEmail({ ref: "SP-1", name: "Asha", email: "asha@example.com", phone: "09456782310", subject: "Hi", message: "Hello there friend" }, SITE);
    expect(s.html).toContain('href="tel:+919456782310"'); // a leading 0 is dropped
    expect(s.html).not.toContain("&lt;asha@example.com&gt;"); // no more "Name <email>" text for the mail app to auto-link
  });
  it("a phone that isn't an Indian mobile stays plain text; an email that isn't one is not linked", () => {
    const s = supportAdminEmail({ ref: "SP-1", name: "Asha", email: "not an email", phone: "12345", subject: "Hi", message: "Hello there friend" }, SITE);
    expect(s.html).not.toContain("tel:+");
    expect(s.html).not.toContain('href="mailto:not');
    expect(s.html).toContain("12345");
  });
});

describe("password emails", () => {
  const url = `${SITE}/reset-password?token=${"A".repeat(43)}`;
  const reset = passwordResetEmail({ firstName: "Asha", email: "asha.verma@example.com", resetUrl: url, expiresMinutes: 30, requestedAt: new Date("2026-10-14T10:12:00Z"), siteUrl: SITE });

  it("reset email: a button and a copy-paste link, the expiry, the request time and a 'didn't ask?' reassurance", () => {
    expect(reset.subject).toBe("Reset your CULTRAVEN password");
    expect(reset.html).toContain(`href="${url}"`);
    expect(reset.html).toContain("RESET MY PASSWORD");
    expect(reset.html).toContain("30 minutes");
    expect(reset.html).toContain("once");
    expect(reset.html).toContain("Wed, 14 Oct 2026, 3:42 pm IST");
    expect(reset.html).toContain("your password will not change");
    expect(reset.html).toContain("will never ask for your password, OTP or card details");
    expect(reset.text).toContain(url);
  });
  it("reset email never shows the full address and never contains a password", () => {
    expect(reset.html).toContain("as********@example.com");
    expect(reset.html).not.toContain("asha.verma@example.com");
    expect(reset.html + reset.text).not.toMatch(/password:\s*\S/i);
  });
  it("password-changed email: when, a sign-in button and a reset link for 'wasn't you'", () => {
    const c = passwordChangedEmail({ firstName: "Asha", changedAt: new Date("2026-10-14T10:12:00Z"), signInUrl: `${SITE}/login`, resetUrl: `${SITE}/forgot-password`, siteUrl: SITE });
    expect(c.subject).toBe("Your CULTRAVEN password was changed");
    expect(c.html).toContain("Wed, 14 Oct 2026, 3:42 pm IST");
    expect(c.html).toContain('href="https://cultraven.com/login"');
    expect(c.html).toContain('href="https://cultraven.com/forgot-password"');
    expect(c.html).toContain("Wasn't you?");
    expect(c.html).toContain("signed out on your other devices");
  });
  it("staff-account email carries a set-password link, never the password", () => {
    const m = staffAccountCreatedEmail({ firstName: "Ravi", email: "ravi@x.com", setPasswordUrl: url, expiresHours: 48, role: "delivery", loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE });
    expect(m.html).toContain("SET MY PASSWORD");
    expect(m.html).toContain(`href="${url}"`);
    expect(m.html).toContain("48 hours");
    expect(m.html).toContain("Delivery Portal");
    expect(m.html + m.text).not.toMatch(/Temp#|Password:/);
  });
  it("welcome email greets by name, lists what the account gives and links to the shop", () => {
    const w = welcomeEmail({ firstName: "Asha", siteUrl: SITE });
    expect(w.subject).toBe("Welcome to CULTRAVEN, Asha");
    expect(w.html).toContain("START SHOPPING");
    expect(w.html).toContain('href="https://cultraven.com/collections"');
    expect(w.html).toContain("Track every order");
  });
});
