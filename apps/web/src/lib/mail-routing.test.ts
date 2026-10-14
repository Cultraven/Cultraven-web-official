import { describe, it, expect } from "vitest";
import { MAIL_CATEGORIES, categoryOf, chosenProfile, pickProfile, cleanRouting, isProfile } from "./mail-routing";

describe("every email kind the site sends belongs to a category", () => {
  const KINDS: [string, string][] = [
    ["order-customer", "order-confirmation"], ["order-customer-resend", "order-confirmation"],
    ["order-status-confirmed", "order-updates"], ["order-status-shipped", "order-updates"], ["order-status-cancel_requested", "order-updates"], ["order-status-delivered", "order-updates"],
    ["order-admin", "order-alerts"], ["admin-cancelled", "order-alerts"], ["admin-cancel_requested", "order-alerts"], ["admin-return_requested", "order-alerts"],
    ["support-admin", "support"], ["support-ack", "support"],
    ["welcome", "account"], ["password-reset", "account"], ["password-changed", "account"],
    ["staff_account_created", "staff"], ["delivery_kyc_submitted", "staff"], ["delivery_kyc_decision", "staff"],
  ];
  it.each(KINDS)("%s -> %s", (kind, cat) => expect(categoryOf(kind)?.id).toBe(cat));
  it("each category's sample kind really belongs to it", () => { for (const c of MAIL_CATEGORIES) expect(categoryOf(c.sample)?.id).toBe(c.id); });
  it("an unknown kind has no category", () => expect(categoryOf("something-new")).toBeNull());
  it("categories have unique ids and say who gets it and when", () => {
    expect(new Set(MAIL_CATEGORIES.map((c) => c.id)).size).toBe(MAIL_CATEGORIES.length);
    for (const c of MAIL_CATEGORIES) { expect(c.label.length).toBeGreaterThan(3); expect(c.audience.length).toBeGreaterThan(3); expect(c.when.length).toBeGreaterThan(20); }
  });
});

describe("which mailbox is chosen", () => {
  it("defaults: order emails from Orders; contact-form, account and staff emails from Support", () => {
    expect(chosenProfile("order-customer", {})).toBe("orders");
    expect(chosenProfile("order-status-shipped", {})).toBe("orders");
    expect(chosenProfile("order-admin", {})).toBe("orders");
    expect(chosenProfile("support-ack", {})).toBe("support");
    expect(chosenProfile("welcome", {})).toBe("support");
    expect(chosenProfile("staff_account_created", {})).toBe("support");
  });
  it("an admin choice overrides the default; unknown kinds use Orders", () => {
    expect(chosenProfile("welcome", { account: "orders" })).toBe("orders");
    expect(chosenProfile("order-customer", { "order-confirmation": "support" })).toBe("support");
    expect(chosenProfile("something-new", {})).toBe("orders");
  });
});

describe("which mailbox actually sends", () => {
  const both = new Set(["orders", "support"] as const);
  const onlyOrders = new Set(["orders"] as const);
  const onlySupport = new Set(["support"] as const);
  it("the chosen one when it is set up", () => expect(pickProfile("support-ack", {}, both)).toEqual({ profile: "support", chosen: "support", fellBack: false }));
  it("falls back to Orders (and says so) when the chosen mailbox isn't set up — today's single-mailbox sites keep working unchanged", () => {
    expect(pickProfile("welcome", {}, onlyOrders)).toEqual({ profile: "orders", chosen: "support", fellBack: true });
    expect(pickProfile("order-customer", {}, onlyOrders)).toEqual({ profile: "orders", chosen: "orders", fellBack: false });
  });
  it("order emails are NOT silently moved to Support when Orders is off", () => {
    expect(pickProfile("order-customer", {}, onlySupport)).toBeNull();
  });
  it("nothing usable -> null (the email is logged as skipped)", () => expect(pickProfile("welcome", {}, new Set())).toBeNull());
});

describe("saved routing is cleaned", () => {
  it("keeps only known categories with known mailboxes", () => {
    expect(cleanRouting({ account: "orders", support: "nope", bogus: "orders", "order-alerts": "support" })).toEqual({ account: "orders", "order-alerts": "support" });
    expect(cleanRouting(null)).toEqual({});
    expect(cleanRouting("x")).toEqual({});
    expect(isProfile("support")).toBe(true);
    expect(isProfile("admin")).toBe(false);
  });
});
