import { describe, it, expect } from "vitest";
import { canAdminTransition, cancelEligibility, returnEligibility, buildTimeline, ADMIN_TRANSITIONS, ORDER_STATUSES, isBackward } from "./order-lifecycle";

const DAY = 86_400_000;
const now = Date.UTC(2026, 9, 10, 12);
const ago = (d: number) => new Date(now - d * DAY);

describe("admin transitions", () => {
  it("allows the normal forward path", () => {
    expect(canAdminTransition("processing", "confirmed")).toBe(true);
    expect(canAdminTransition("confirmed", "shipped")).toBe(true);
    expect(canAdminTransition("shipped", "out_for_delivery")).toBe(true);
    expect(canAdminTransition("out_for_delivery", "delivered")).toBe(true);
    expect(canAdminTransition("return_requested", "returned")).toBe(true);
    expect(canAdminTransition("return_requested", "delivered")).toBe(true);
  });
  it("blocks going backwards, skipping out of terminal states, and junk", () => {
    expect(canAdminTransition("delivered", "processing")).toBe(false);
    expect(canAdminTransition("cancelled", "shipped")).toBe(false);
    expect(canAdminTransition("cancelled", "processing")).toBe(false);
    expect(canAdminTransition("returned", "delivered")).toBe(false);
    expect(canAdminTransition("processing", "return_requested")).toBe(false);
    expect(canAdminTransition("processing", "nonsense")).toBe(false);
    expect(canAdminTransition({ $ne: 1 } as any, "shipped")).toBe(false);
  });
  it("lets an admin cancel a shipped order and undo a mis-click one step back", () => {
    expect(canAdminTransition("shipped", "cancelled")).toBe(true);
    expect(canAdminTransition("out_for_delivery", "cancelled")).toBe(true);
    expect(canAdminTransition("shipped", "confirmed")).toBe(true);
    expect(canAdminTransition("delivered", "out_for_delivery")).toBe(true);
    expect(isBackward("shipped", "confirmed")).toBe(true);
    expect(isBackward("shipped", "out_for_delivery")).toBe(false);
    expect(canAdminTransition("cancelled", "processing")).toBe(false);
    expect(canAdminTransition("returned", "delivered")).toBe(false);
  });
  it("covers every status", () => expect(Object.keys(ADMIN_TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort()));
});

describe("customer cancel (7 days, before shipping)", () => {
  it("ok on day 0 and day 6, with days left", () => {
    expect(cancelEligibility({ fulfillmentStatus: "processing", createdAt: ago(0) }, now)).toMatchObject({ ok: true, daysLeft: 7 });
    expect(cancelEligibility({ fulfillmentStatus: "confirmed", createdAt: ago(6) }, now)).toMatchObject({ ok: true, daysLeft: 1 });
  });
  it("blocked after 7 days", () => expect(cancelEligibility({ fulfillmentStatus: "processing", createdAt: ago(7.01) }, now).ok).toBe(false));
  it("after shipping it becomes a request (admin approves) within the 7 days", () => {
    expect(cancelEligibility({ fulfillmentStatus: "shipped", createdAt: ago(1) }, now)).toMatchObject({ ok: true, mode: "request" });
    expect(cancelEligibility({ fulfillmentStatus: "out_for_delivery", createdAt: ago(3) }, now)).toMatchObject({ ok: true, mode: "request" });
    expect(cancelEligibility({ fulfillmentStatus: "processing", createdAt: ago(1) }, now).mode).toBe("direct");
    expect(cancelEligibility({ fulfillmentStatus: "shipped", createdAt: ago(1), cancelRequestedAt: ago(0) }, now).ok).toBe(false);
    expect(cancelEligibility({ fulfillmentStatus: "shipped", createdAt: ago(8) }, now).ok).toBe(false);
  });
  it("blocked once delivered / cancelled, with a helpful reason", () => {
    expect(cancelEligibility({ fulfillmentStatus: "delivered", createdAt: ago(1) }, now).reason).toMatch(/return/i);
    expect(cancelEligibility({ fulfillmentStatus: "cancelled", createdAt: ago(1) }, now).ok).toBe(false);
  });
  it("blocked for a bad date", () => expect(cancelEligibility({ fulfillmentStatus: "processing", createdAt: "nope" }, now).ok).toBe(false));
});

describe("customer return (7 days from delivery)", () => {
  it("ok within the window", () => expect(returnEligibility({ fulfillmentStatus: "delivered", deliveredAt: ago(3) }, now)).toMatchObject({ ok: true, daysLeft: 4 }));
  it("blocked after the window, before delivery, or without a delivery date", () => {
    expect(returnEligibility({ fulfillmentStatus: "delivered", deliveredAt: ago(8) }, now).ok).toBe(false);
    expect(returnEligibility({ fulfillmentStatus: "shipped" }, now).ok).toBe(false);
    expect(returnEligibility({ fulfillmentStatus: "delivered" }, now).ok).toBe(false);
  });
  it("blocked when already requested or returned", () => {
    expect(returnEligibility({ fulfillmentStatus: "return_requested", deliveredAt: ago(1) }, now).ok).toBe(false);
    expect(returnEligibility({ fulfillmentStatus: "returned", deliveredAt: ago(1) }, now).ok).toBe(false);
  });
});

describe("timeline", () => {
  const created = ago(5);
  it("marks progress for a shipped order", () => {
    const t = buildTimeline({ fulfillmentStatus: "shipped", createdAt: created, statusHistory: [{ status: "confirmed", at: ago(4) }, { status: "shipped", at: ago(2) }] });
    expect(t.map((s) => s.state)).toEqual(["done", "done", "done", "current", "todo", "todo"]);
    expect(t[3].at).toBeTruthy();
    expect(t[4].at).toBeUndefined();
  });
  it("delivered shows everything done", () => {
    const t = buildTimeline({ fulfillmentStatus: "delivered", createdAt: created, statusHistory: [{ status: "delivered", at: ago(1) }] });
    expect(t.every((s) => s.state === "done")).toBe(true);
  });
  it("cancelled keeps earlier steps and adds a red step with the reason", () => {
    const t = buildTimeline({ fulfillmentStatus: "cancelled", createdAt: created, statusHistory: [{ status: "cancelled", at: ago(1), note: "Ordered by mistake" }] });
    expect(t[t.length - 1]).toMatchObject({ key: "cancelled", state: "bad", note: "Ordered by mistake" });
    expect(t[0].state).toBe("done");
    expect(t[3].state).toBe("todo");
  });
  it("return flow appends return steps", () => {
    const t = buildTimeline({ fulfillmentStatus: "return_requested", createdAt: created, statusHistory: [{ status: "return_requested", at: ago(0), note: "Size" }] });
    expect(t.at(-1)).toMatchObject({ key: "return_requested", state: "current" });
    const t2 = buildTimeline({ fulfillmentStatus: "returned", createdAt: created, statusHistory: [] });
    expect(t2.at(-1)).toMatchObject({ key: "returned" });
  });
  it("tolerates unknown status", () => expect(buildTimeline({ fulfillmentStatus: "weird", createdAt: created })[0].state).toBe("current"));

describe("extra statuses: packed, on hold, delivery failed, returned to origin", () => {
  it("packed sits between confirmed and shipped and is skippable", () => {
    expect(canAdminTransition("confirmed", "packed")).toBe(true);
    expect(canAdminTransition("packed", "shipped")).toBe(true);
    expect(canAdminTransition("processing", "shipped")).toBe(true);
    expect(canAdminTransition("shipped", "packed")).toBe(true);
    expect(isBackward("shipped", "packed")).toBe(true);
  });
  it("on hold can be entered before shipping and resumed or cancelled", () => {
    for (const from of ["processing", "confirmed", "packed"]) expect(canAdminTransition(from, "on_hold")).toBe(true);
    expect(canAdminTransition("shipped", "on_hold")).toBe(false);
    for (const to of ["processing", "confirmed", "packed", "cancelled"]) expect(canAdminTransition("on_hold", to)).toBe(true);
    expect(canAdminTransition("on_hold", "shipped")).toBe(false);
  });
  it("failed delivery can retry, deliver, go back to origin or cancel; RTO is final", () => {
    for (const from of ["shipped", "out_for_delivery"]) expect(canAdminTransition(from, "delivery_failed")).toBe(true);
    for (const to of ["out_for_delivery", "delivered", "rto", "cancelled"]) expect(canAdminTransition("delivery_failed", to)).toBe(true);
    expect(ADMIN_TRANSITIONS.rto).toEqual([]);
    expect(canAdminTransition("processing", "rto")).toBe(false);
  });
  it("customer cancel: on hold / packed are instant, failed delivery is a request", () => {
    expect(cancelEligibility({ fulfillmentStatus: "packed", createdAt: ago(1) }, now).mode).toBe("direct");
    expect(cancelEligibility({ fulfillmentStatus: "on_hold", createdAt: ago(1) }, now).mode).toBe("direct");
    expect(cancelEligibility({ fulfillmentStatus: "delivery_failed", createdAt: ago(1) }, now).mode).toBe("request");
    expect(cancelEligibility({ fulfillmentStatus: "rto", createdAt: ago(1) }, now).ok).toBe(false);
  });
  it("timeline: packed is a normal step; on hold / failed / RTO append a side step", () => {
    const created = ago(5);
    const packed = buildTimeline({ fulfillmentStatus: "packed", createdAt: created, statusHistory: [{ status: "packed", at: ago(1) }] });
    expect(packed.map((s) => s.key)).toEqual(["processing", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"]);
    expect(packed[2].state).toBe("current");
    const hold = buildTimeline({ fulfillmentStatus: "on_hold", createdAt: created, statusHistory: [{ status: "confirmed", at: ago(4) }, { status: "on_hold", at: ago(1), note: "Verifying address" }] });
    expect(hold.at(-1)).toMatchObject({ key: "on_hold", state: "current", note: "Verifying address" });
    expect(hold[1].state).toBe("done");
    const failed = buildTimeline({ fulfillmentStatus: "delivery_failed", createdAt: created, statusHistory: [{ status: "shipped", at: ago(2) }, { status: "delivery_failed", at: ago(0) }] });
    expect(failed.at(-1)).toMatchObject({ key: "delivery_failed", state: "current" });
    expect(failed[3].state).toBe("done"); // shipped
    const rto = buildTimeline({ fulfillmentStatus: "rto", createdAt: created, statusHistory: [{ status: "shipped", at: ago(3) }] });
    expect(rto.at(-1)).toMatchObject({ key: "rto", state: "bad" });
  });
});
});
