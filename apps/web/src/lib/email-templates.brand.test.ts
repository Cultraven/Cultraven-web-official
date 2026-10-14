/** The professional header/footer on every email: logo, inbox preview line, the registered business details, and a footer that fits who receives it. */
import { describe, it, expect } from "vitest";
import {
  customerOrderEmail, adminOrderEmail, testEmail, orderStatusEmail, adminCustomerActionEmail, supportAdminEmail, supportAckEmail,
  staffAccountCreatedEmail, deliveryKYCSubmittedEmail, deliveryKYCDecisionEmail, welcomeEmail, passwordResetEmail, passwordChangedEmail, type MailOrder,
} from "./email-templates";
import { BUSINESS } from "./business";

const SITE = "https://cultraven.com";
const order: MailOrder = {
  id: "64b0000000000000000abc12", createdAt: new Date(), paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Tee", size: "M", color: "Black", quantity: 1, pricePaise: 149900 }],
  subtotalPaise: 149900, discountPaise: 0, shippingPaise: 9900, codFeePaise: 4900, totalPaise: 164700,
  deliveryAddress: { name: "Asha Verma", email: "a@example.com", phone: "9456782310", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};
const sm = { ref: "SP-1A2B3C", name: "Asha", email: "a@example.com", phone: "9456782310", subject: "Help", message: "Please help me with my order today." };

const customer = [
  ["order confirmation", customerOrderEmail(order, SITE, { receiptAttached: true })],
  ["status update", orderStatusEmail(order, SITE, { status: "shipped", courier: "Delhivery", trackingNumber: "DLV1" })],
  ["support acknowledgement", supportAckEmail(sm, SITE, "Mon–Sat, 10 AM – 6 PM IST")],
  ["welcome", welcomeEmail({ firstName: "Asha", siteUrl: SITE })],
] as const;
const security = [
  ["password reset", passwordResetEmail({ firstName: "Asha", email: "asha@example.com", resetUrl: `${SITE}/reset-password?token=abc`, expiresMinutes: 30, requestedAt: new Date(), siteUrl: SITE })],
  ["password changed", passwordChangedEmail({ firstName: "Asha", changedAt: new Date(), signInUrl: `${SITE}/login`, resetUrl: `${SITE}/forgot-password`, siteUrl: SITE })],
] as const;
const team = [
  ["new-order alert", adminOrderEmail(order, SITE)],
  ["customer-action alert", adminCustomerActionEmail(order, SITE, "cancelled", "Changed my mind")],
  ["support alert", supportAdminEmail(sm, SITE)],
  ["KYC submitted", deliveryKYCSubmittedEmail({ partnerName: "Ravi", partnerEmail: "r@x.com", adminUrl: `${SITE}/portal-secure/delivery-verification`, siteUrl: SITE })],
  ["SMTP test", testEmail(SITE)],
] as const;
const account = [
  ["staff account", staffAccountCreatedEmail({ firstName: "Asha", email: "s@x.com", setPasswordUrl: `${SITE}/reset-password?token=abc`, expiresHours: 48, role: "admin", loginUrl: `${SITE}/portal-access`, siteUrl: SITE })],
  ["KYC decision", deliveryKYCDecisionEmail({ firstName: "Ravi", approved: true, loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE })],
] as const;
const everything = [...customer, ...team, ...account, ...security];

describe("email header and footer", () => {
  it.each(everything.map((e) => [e[0], e[1]] as const))("%s: logo header, inbox preview line and the registered business details", (_n, m) => {
    expect(m.html).toContain(`<img src="${SITE}/email-logo.png"`);
    expect(m.html).toContain('alt="CULTRAVEN"'); // the name still shows if the mail app blocks images
    expect(m.html).toMatch(/<div style="display:none[^>]*>[^<]{10,}/); // preheader text
    expect(m.html).toContain(`GSTIN ${BUSINESS.gstin}`);
    expect(m.html).toContain("162, Jay Shri Nagar, Indore, Madhya Pradesh 452005");
    expect(m.html).toContain("23BJHPH4892N1ZQ");
    expect(m.html).toContain(`&copy; ${new Date().getFullYear()} CULTRAVEN`);
  });

  it.each(everything.map((e) => [e[0], e[1]] as const))("%s: no placeholder company details anywhere", (_n, m) => {
    for (const old of ["PVT LTD", "Plot 42", "AB Road", "Vijay Nagar", "452010", "AABCB"]) expect(m.html + m.text).not.toContain(old);
  });

  it.each(customer.map((e) => [e[0], e[1]] as const))("%s (customer): help line, useful links and the delivery / returns promise", (_n, m) => {
    expect(m.html).toContain("mailto:support@cultraven.com");
    for (const path of ["/account/orders", "/help", "/pages/returns", "/pages/shipping"]) expect(m.html).toContain(`href="${SITE}${path}"`);
    expect(m.html).toContain("Free delivery");
    expect(m.html).toContain("₹1,999");
    expect(m.html).toContain("7-day");
    expect(m.html).toContain("because of your order or account");
  });

  it.each([...customer, ...account, ...security].map((e) => [e[0], e[1]] as const))("%s: the support phone (+91 89622 12605) is one tap away — call, WhatsApp and email", (_n, m) => {
    expect(m.html).toContain("+91 89622 12605");
    expect(m.html).toContain('href="tel:+918962212605"');
    expect(m.html).toContain('href="https://wa.me/918962212605?text=');
    expect(m.html).toContain('href="mailto:support@cultraven.com"');
    expect(m.html).toContain("Mon–Sat, 10 AM – 7 PM IST");
  });

  it.each(security.map((e) => [e[0], e[1]] as const))("%s (security): explains why it arrived and has no shopping promotion", (_n, m) => {
    expect(m.html).toContain("security-related action on your CULTRAVEN account");
    expect(m.html).not.toContain("Free delivery");
    expect(m.html).not.toContain("Internal notification");
  });

  it.each(team.map((e) => [e[0], e[1]] as const))("%s (team): says it is internal and links to the admin, with no shopper promotion", (_n, m) => {
    expect(m.html).toContain("Internal notification for the CULTRAVEN team");
    expect(m.html).toContain(`href="${SITE}/portal-secure"`);
    expect(m.html).toContain("/portal-secure/settings/email");
    expect(m.html).not.toContain("Free delivery");
    expect(m.html).not.toContain("because of your order");
  });

  it.each(account.map((e) => [e[0], e[1]] as const))("%s (account): explains why the email arrived", (_n, m) => {
    expect(m.html).toContain("a CULTRAVEN account was created for you");
    expect(m.html).toContain("mailto:support@cultraven.com");
  });

  it("footer link rows are compact: 34px tall to tap on a phone, tighter again on laptop screens, with no extra gaps between the groups", () => {
    for (const [, m] of [...customer, ...account, ...security]) {
      const links = [...m.html.matchAll(/<a class="fl"[^>]*>/g)].map((x) => x[0]);
      expect(links.length).toBeGreaterThanOrEqual(4); // call, WhatsApp, email + at least one footer link
      for (const l of links) expect(l).toContain("line-height:20px;padding:7px 16px 7px 0");
      expect(m.html).toContain("@media (min-width:601px){.fl{padding-top:3px!important;padding-bottom:3px!important}}");
      expect(m.html).toContain('<p style="margin:0 0 6px"><a class="fl" href="tel:+918962212605"'); // help links sit right under "Need help?"
    }
  });

  it("the inbox preview is the email's own intro, so the list view reads well", () => {
    const m = customerOrderEmail(order, SITE);
    expect(m.html).toMatch(/<div style="display:none[^>]*>Hi Asha/);
  });
});
