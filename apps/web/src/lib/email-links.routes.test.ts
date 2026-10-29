// @vitest-environment node
/**
 * Every link inside every email must lead to a page that really exists in the app. (A "START SHOPPING" button once pointed at /shop,
 * which only exists with a product name after it — a 404 for every new customer. This test would have caught it.)
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  customerOrderEmail, adminOrderEmail, testEmail, orderStatusEmail, adminCustomerActionEmail, supportAdminEmail, supportAckEmail, welcomeEmail,
  passwordResetEmail, passwordChangedEmail, staffAccountCreatedEmail, deliveryKYCSubmittedEmail, deliveryKYCDecisionEmail, type MailOrder, notifyWelcomeEmail, notifyAdminEmail } from "./email-templates";
import { ORDER_STATUSES } from "./order-lifecycle";

const SITE = "https://cultraven.com";
const APP = path.join(__dirname, "../app");

/** Every page the app serves, as a pattern. Route groups "(x)" don't appear in the address; [slug] is one segment; [...slug] is one or more. */
function routes(dir = APP, prefix: string[] = []): RegExp[] {
  const out: RegExp[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  if (entries.some((e) => e.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(e.name))) {
    const src = prefix.map((s) => (/^\[\[\.\.\..+\]\]$/.test(s) ? "(?:/.+)?" : /^\[\.\.\..+\]$/.test(s) ? "/.+" : /^\[.+\]$/.test(s) ? "/[^/]+" : `/${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)).join("");
    out.push(new RegExp(`^${src || "/"}$`));
  }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === "api" || e.name.startsWith("_") || e.name.startsWith("@")) continue;
    out.push(...routes(path.join(dir, e.name), /^\(.+\)$/.test(e.name) ? prefix : [...prefix, e.name]));
  }
  return out;
}

const order: MailOrder = {
  id: "64b0000000000000000abc12", createdAt: new Date("2026-10-12T04:30:00Z"), paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Tee", size: "M", color: "Black", quantity: 2, pricePaise: 149900, image: "/uploads/a.png" }],
  subtotalPaise: 299800, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 304700,
  deliveryAddress: { name: "Asha Verma", email: "asha@example.com", phone: "9456782310", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};
const sm = { ref: "HLP-1A2B3C", name: "Asha", email: "asha@example.com", phone: "9456782310", subject: "Help", message: "Please help me with my order today.", orderRef: "CR-0ABC12" };
const picks = [1, 2].map((n) => ({ title: `Pick ${n}`, pricePaise: 199900, image: `${SITE}/uploads/p.png`, url: `${SITE}/products/raven-tee-${n}` }));
const token = `${SITE}/reset-password?token=${"A".repeat(43)}`;

const everyEmail: [string, string][] = [
  ["order confirmation", customerOrderEmail(order, SITE, { receiptAttached: true }).html],
  ["new-order alert", adminOrderEmail(order, SITE).html],
  ["SMTP test", testEmail(SITE).html],
  ...[...ORDER_STATUSES, "cancel_requested"].map((s) => [`status ${s}`, orderStatusEmail(order, SITE, { status: s, picks: s === "cancelled" ? picks : undefined, courier: "Delhivery", trackingNumber: "DLV1", trackingUrl: "https://www.delhivery.com/track/DLV1" }).html] as [string, string]),
  ...(["cancelled", "cancel_requested", "return_requested"] as const).map((k) => [`alert ${k}`, adminCustomerActionEmail(order, SITE, k, "Reason").html] as [string, string]),
  ["support alert", supportAdminEmail(sm, SITE).html],
  ["support acknowledgement", supportAckEmail(sm, SITE, "Mon–Sat, 10 AM – 7 PM IST").html],
  ["welcome", welcomeEmail({ firstName: "Asha", siteUrl: SITE }).html],
  ["drop-alert thank-you", notifyWelcomeEmail({ interest: "New Drop", siteUrl: SITE }).html],
  ["drop-alert team alert", notifyAdminEmail({ email: "fan@example.com", interest: "New Drop", page: "/", total: 3, siteUrl: SITE }).html],
  ["password reset", passwordResetEmail({ firstName: "Asha", email: "asha@example.com", resetUrl: token, expiresMinutes: 30, requestedAt: new Date(), siteUrl: SITE }).html],
  ["password changed", passwordChangedEmail({ firstName: "Asha", changedAt: new Date(), signInUrl: `${SITE}/login`, resetUrl: `${SITE}/forgot-password`, siteUrl: SITE }).html],
  ...(["admin", "delivery"] as const).map((role) => [`staff account (${role})`, staffAccountCreatedEmail({ firstName: "Ravi", email: "r@x.com", setPasswordUrl: token, expiresHours: 48, role, loginUrl: `${SITE}${role === "delivery" ? "/portal-delivery-access" : "/portal-access"}`, siteUrl: SITE }).html] as [string, string]),
  ["KYC submitted", deliveryKYCSubmittedEmail({ partnerName: "Ravi", partnerEmail: "r@x.com", adminUrl: `${SITE}/portal-secure/delivery-verification`, siteUrl: SITE }).html],
  ["KYC approved", deliveryKYCDecisionEmail({ firstName: "Ravi", approved: true, loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE }).html],
  ["KYC rejected", deliveryKYCDecisionEmail({ firstName: "Ravi", approved: false, note: "Blurry", loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE }).html],
];

describe("every link in every email leads to a real page", () => {
  const pages = routes();
  it("the route scan finds the app's pages (so a passing test means something)", () => {
    for (const p of ["/", "/login", "/collections", "/products/some-slug", "/shop/a/b", "/account/orders/abc", "/portal-secure/orders/abc"]) expect(pages.some((r) => r.test(p))).toBe(true);
    expect(pages.some((r) => r.test("/shop"))).toBe(false); // /shop alone is NOT a page (only /shop/<something>)
    expect(pages.some((r) => r.test("/definitely-not-a-page"))).toBe(false);
    expect(pages.length).toBeGreaterThan(30);
  });
  it.each(everyEmail)("%s", (_name, html) => {
    const links = [...html.matchAll(/href="(https:\/\/cultraven\.com[^"]*)"/g)].map((m) => new URL(m[1].replace(/&amp;/g, "&")).pathname.replace(/\/+$/, "") || "/");
    expect(links.length).toBeGreaterThan(0);
    for (const p of new Set(links)) expect({ path: p, exists: pages.some((r) => r.test(p)) }).toEqual({ path: p, exists: true });
  });
});
