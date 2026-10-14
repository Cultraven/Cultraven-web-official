/**
 * Guards every email template against the things that make an email look broken on a phone, an iPhone, a tablet or a laptop:
 * a missing <head>/viewport/charset, text that stretches the layout (long names, emails, tracking numbers), tiny type, broken links,
 * HTML typed by a customer being treated as markup, and entities leaking into plain-text subject lines.
 * (A real-browser render at nine device sizes backs this up; this test is the fast regression net that runs in CI.)
 */
import { describe, it, expect } from "vitest";
import {
  customerOrderEmail, adminOrderEmail, testEmail, orderStatusEmail, adminCustomerActionEmail, supportAdminEmail, supportAckEmail,
  staffAccountCreatedEmail, deliveryKYCSubmittedEmail, deliveryKYCDecisionEmail, welcomeEmail, passwordResetEmail, passwordChangedEmail, type MailOrder,
} from "./email-templates";

const SITE = "https://cultraven.com";
const LONG = "Supercalifragilisticexpialidocious".repeat(4);

const normal: MailOrder = {
  id: "64b0000000000000000abc12", createdAt: new Date(), paymentMethod: "cod", paymentStatus: "pending",
  items: [{ title: "Raven Oversized Tee — Acid Black", size: "M", color: "Black", quantity: 2, pricePaise: 149900 }],
  subtotalPaise: 299800, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 304700,
  deliveryAddress: { name: "Jitesh Bawaskar", email: "jitesh@example.com", phone: "9456782310", line1: "220 Shantinath Puri", line2: "Near the temple", city: "Indore", state: "Madhya Pradesh", pincode: "452002" },
};
const hostile: MailOrder = {
  ...normal, paymentMethod: "razorpay", paymentStatus: "paid", discountPaise: 50000, shippingPaise: 9900,
  items: [{ title: `${LONG} <b>Tee</b> & "Hoodie" <script>alert(1)</script>`, size: "XXL", color: "Midnight Navy Blue With Gold Trim", quantity: 12, pricePaise: 149900 }],
  deliveryAddress: { ...normal.deliveryAddress, name: `Ravi O'Brien <i>${LONG}</i>`, email: `a.${LONG}@example.com`, line1: `Flat ${LONG}`, city: LONG },
};
// product photos: one absolute, one relative (the site's own upload path) — both must show as thumbnails
normal.items[0].image = "https://cultraven.com/uploads/tee.png";
hostile.items[0].image = "/uploads/hostile.png";
const STATUSES = ["confirmed", "packed", "on_hold", "delivery_failed", "rto", "shipped", "out_for_delivery", "delivered", "cancelled", "cancel_requested", "return_requested", "returned"];
const picks = [1, 2, 3, 4].map((n) => ({ title: `Pick ${n} ${LONG}`.slice(0, 60), pricePaise: 199900, image: "https://cultraven.com/x.png", url: `${SITE}/products/p${n}` }));

type Mail = { subject: string; html: string; text: string };
function all(): { name: string; mail: Mail; hostile: boolean }[] {
  const out: { name: string; mail: Mail; hostile: boolean }[] = [];
  for (const [h, o] of [[false, normal], [true, hostile]] as const) {
    const t = { courier: h ? LONG : "Delhivery", trackingNumber: h ? `DLV${"1234567890".repeat(4)}` : "DLV1234567890", trackingUrl: "https://www.delhivery.com/track/package/DLV1234567890" };
    const add = (name: string, mail: Mail) => out.push({ name: `${name}${h ? " (hostile data)" : ""}`, mail, hostile: h });
    add("order confirmation", customerOrderEmail(o, SITE, { receiptAttached: true }));
    add("new-order alert", adminOrderEmail(o, SITE));
    for (const s of STATUSES) add(`status: ${s}`, orderStatusEmail(o, SITE, { status: s, note: h ? `Note ${LONG} <i>x</i>` : "Checking a detail", ...t, picks: s === "cancelled" ? picks : undefined }));
    for (const k of ["cancelled", "cancel_requested", "return_requested"] as const) add(`alert: ${k}`, adminCustomerActionEmail(o, SITE, k, h ? `Reason ${LONG} <script>x</script>` : "Size doesn't fit"));
    const sm = { ref: "SP-1A2B3C", name: h ? `Ravi <b>O'Brien</b> ${LONG}` : "Jitesh", email: h ? `a.${LONG}@example.com` : "j@example.com", phone: "9456782310", subject: h ? `Help & "urgent" ${LONG}` : "Order help", message: h ? `x ${LONG} <script>alert(1)</script>` : "Please change my address.", orderRef: "CR-0ABC12" };
    add("support alert", supportAdminEmail(sm, SITE));
    add("support acknowledgement", supportAckEmail(sm, SITE, "Mon–Sat, 10 AM – 6 PM IST"));
    add("staff account", staffAccountCreatedEmail({ firstName: h ? `Ravi ${LONG}` : "Jitesh", email: h ? `s.${LONG}@example.com` : "s@x.com", setPasswordUrl: `${SITE}/reset-password?token=${"A".repeat(43)}`, expiresHours: 48, role: "admin", loginUrl: `${SITE}/portal-access`, siteUrl: SITE }));
    add("welcome", welcomeEmail({ firstName: h ? `Ravi ${LONG}` : "Jitesh", siteUrl: SITE }));
    add("password reset", passwordResetEmail({ firstName: h ? `Ravi ${LONG}` : "Jitesh", email: h ? `a.${LONG}@example.com` : "jitesh@example.com", resetUrl: `${SITE}/reset-password?token=${"A".repeat(43)}`, expiresMinutes: 30, requestedAt: new Date(), siteUrl: SITE }));
    add("password changed", passwordChangedEmail({ firstName: h ? `Ravi ${LONG}` : "Jitesh", changedAt: new Date(), signInUrl: `${SITE}/login`, resetUrl: `${SITE}/forgot-password`, siteUrl: SITE }));
    add("KYC submitted", deliveryKYCSubmittedEmail({ partnerName: h ? `Ravi & Sons ${LONG}` : "Ravi", partnerEmail: "r@x.com", adminUrl: `${SITE}/portal-secure/delivery-verification`, siteUrl: SITE }));
    add("KYC approved", deliveryKYCDecisionEmail({ firstName: "Ravi", approved: true, loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE }));
    add("KYC rejected", deliveryKYCDecisionEmail({ firstName: "Ravi", approved: false, note: h ? `Blurry ${LONG} <b>x</b>` : "Blurry photo", loginUrl: `${SITE}/portal-delivery-access`, siteUrl: SITE }));
    add("SMTP test", testEmail(SITE));
  }
  return out;
}
const MAILS = all();

describe("email templates work on phones, iPhones, tablets and laptops", () => {
  it("covers every template (27 per data set, normal and hostile)", () => expect(MAILS.length).toBe(54));

  it.each(MAILS.map((m) => [m.name, m] as const))("%s: has the head every mail app needs (charset, viewport, lang, title, light colour scheme)", (_n, m) => {
    expect(m.mail.html.startsWith("<!doctype html>")).toBe(true);
    expect(m.mail.html).toContain('<html lang="en">');
    expect(m.mail.html).toContain('<meta charset="utf-8">');
    expect(m.mail.html).toContain('name="viewport" content="width=device-width,initial-scale=1"');
    expect(m.mail.html).toContain('name="color-scheme" content="light"');
    expect(m.mail.html).toContain('name="format-detection" content="telephone=no,date=no,address=no,email=no"'); // the mail app doesn't paint its own blue links over our text
    expect(m.mail.html).toMatch(/<title>[^<]+<\/title>/);
  });

  it.each(MAILS.map((m) => [m.name, m] as const))("%s: fluid layout — never wider than 600px, and long text wraps instead of stretching it", (_n, m) => {
    const h = m.mail.html;
    expect(h).toContain("max-width:600px");
    for (const w of h.matchAll(/<table[^>]*\bwidth="(\d+)"/g)) expect(Number(w[1])).toBeLessThanOrEqual(600); // no fixed-width table wider than a card
    expect(h).not.toMatch(/width:\s*(?:[7-9]\d\d|\d{4,})px/);
    expect(h).toContain("word-break:break-word;overflow-wrap:anywhere");
  });

  it.each(MAILS.map((m) => [m.name, m] as const))("%s: readable type (nothing under 12px apart from the hidden spacer) and links are absolute https or mailto", (_n, m) => {
    const visible = m.mail.html.replace(/<div style="display:none[^>]*>[\s\S]*?<\/div>/, ""); // the hidden inbox-preview line is deliberately tiny and never shown
    for (const s of visible.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) { const px = Number(s[1]); if (px !== 0) expect(px).toBeGreaterThanOrEqual(12); }
    for (const a of m.mail.html.matchAll(/<a [^>]*href="([^"]*)"/g)) expect(a[1]).toMatch(/^(https:\/\/|mailto:|tel:\+\d{10,13}$)/);
    for (const i of m.mail.html.matchAll(/<img\b[^>]*>/g)) expect(i[0]).toMatch(/\balt="/);
  });

  it.each(MAILS.map((m) => [m.name, m] as const))("%s: subject is plain text (no HTML entities) and a plain-text version exists", (_n, m) => {
    expect(m.mail.subject.length).toBeGreaterThan(5);
    expect(m.mail.subject.length).toBeLessThanOrEqual(200);
    expect(m.mail.subject).not.toMatch(/&(amp|lt|gt|quot|#39);/);
    expect(m.mail.text.trim().length).toBeGreaterThan(20);
    expect(m.mail.text).not.toMatch(/<\/?(table|td|tr|div|span|h1|html|body)\b/i); // no template markup leaking into the text part
  });

  it.each(MAILS.filter((m) => m.hostile).map((m) => [m.name, m] as const))("%s: customer-typed HTML is shown as text, never run as markup", (_n, m) => {
    for (const raw of ["<script", "<b>Tee</b>", "<b>O'Brien</b>", "<i>x</i>", `<i>${LONG}</i>`, "<b>x</b>"]) expect(m.mail.html).not.toContain(raw);
    if (/order confirmation|new-order alert/.test(m.name)) expect(m.mail.html).toContain("&lt;script&gt;");
  });

  it("the order-status picks sit two across so they stay readable on a phone", () => {
    const m = orderStatusEmail(normal, SITE, { status: "cancelled", picks });
    expect(m.html).not.toContain('width="25%"');
    expect(m.html.match(/width="50%"/g)?.length).toBe(4);
  });

  it("money amounts never split across two lines", () => {
    const m = customerOrderEmail(hostile, SITE);
    expect(m.html).toMatch(/white-space:nowrap;word-break:normal">₹/);
  });
});
