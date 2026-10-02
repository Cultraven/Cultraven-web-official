/**
 * Order lifecycle rules — PURE (no DB, safe to import in the browser and on the server).
 * The server enforces these on every change; the UI uses them to decide which buttons to show.
 *
 *   processing → confirmed → shipped → out_for_delivery → delivered
 *        ↘ cancelled (customer within 7 days, or admin)        ↘ return_requested → returned
 *                                                                  (admin may reject → back to delivered)
 */

export const ORDER_STATUSES = ["processing", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CANCEL_WINDOW_DAYS = 7;
export const RETURN_WINDOW_DAYS = 7;
const DAY = 86_400_000;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: "Order placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
};

/** What an admin may move an order to from each status (no going backwards; terminal states are final). */
export const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  processing: ["confirmed", "shipped", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: ["returned"],
  return_requested: ["returned", "delivered"], // "delivered" = return rejected
  cancelled: [],
  returned: [],
};

export const isOrderStatus = (v: unknown): v is OrderStatus => typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);

export function canAdminTransition(from: string, to: string): boolean {
  return isOrderStatus(from) && isOrderStatus(to) && ADMIN_TRANSITIONS[from].includes(to);
}

const ts = (d: Date | string | number | undefined | null) => (d ? new Date(d).getTime() : NaN);

export interface Eligibility { ok: boolean; reason?: string; daysLeft?: number }

/** Customers can cancel until the order ships, and only within 7 days of placing it. */
export function cancelEligibility(o: { fulfillmentStatus: string; createdAt: Date | string }, now = Date.now()): Eligibility {
  if (o.fulfillmentStatus === "cancelled") return { ok: false, reason: "This order is already cancelled." };
  if (!["processing", "confirmed"].includes(o.fulfillmentStatus)) {
    return { ok: false, reason: o.fulfillmentStatus === "delivered" ? "Delivered orders can be returned instead." : "This order has already shipped, so it can't be cancelled. You can return it after delivery." };
  }
  const elapsed = now - ts(o.createdAt);
  if (!(elapsed >= 0) || elapsed > CANCEL_WINDOW_DAYS * DAY) return { ok: false, reason: `The ${CANCEL_WINDOW_DAYS}-day cancellation window has passed.` };
  return { ok: true, daysLeft: Math.max(0, Math.ceil((CANCEL_WINDOW_DAYS * DAY - elapsed) / DAY)) };
}

/** Customers can request a return within 7 days of delivery. */
export function returnEligibility(o: { fulfillmentStatus: string; deliveredAt?: Date | string | null }, now = Date.now()): Eligibility {
  if (o.fulfillmentStatus === "return_requested") return { ok: false, reason: "A return has already been requested." };
  if (o.fulfillmentStatus === "returned") return { ok: false, reason: "This order has already been returned." };
  if (o.fulfillmentStatus !== "delivered") return { ok: false, reason: "Returns open once the order is delivered." };
  const at = ts(o.deliveredAt);
  if (!(at > 0)) return { ok: false, reason: "Delivery date missing — please contact support." };
  const elapsed = now - at;
  if (elapsed < 0 || elapsed > RETURN_WINDOW_DAYS * DAY) return { ok: false, reason: `The ${RETURN_WINDOW_DAYS}-day return window has passed.` };
  return { ok: true, daysLeft: Math.max(0, Math.ceil((RETURN_WINDOW_DAYS * DAY - elapsed) / DAY)) };
}

export const CANCEL_REASONS = ["Ordered by mistake", "Found a better price", "Delivery is taking too long", "Want to change size/colour/address", "Other"] as const;
export const RETURN_REASONS = ["Size doesn't fit", "Not as described / photos", "Quality issue", "Received damaged", "Wrong item received", "Other"] as const;

export interface HistoryEvent { status: string; note?: string; at: Date | string; by?: string }
export interface TimelineStep { key: string; label: string; at?: string; state: "done" | "current" | "todo" | "bad"; note?: string }

const FLOW: OrderStatus[] = ["processing", "confirmed", "shipped", "out_for_delivery", "delivered"];

/**
 * Tracking steps for the order page. Done steps carry the time they were reached (from statusHistory);
 * cancelled / return states are appended as a final red/amber step.
 */
export function buildTimeline(o: { fulfillmentStatus: string; createdAt: Date | string; statusHistory?: HistoryEvent[] }): TimelineStep[] {
  const hist = o.statusHistory ?? [];
  const when = (s: string) => {
    const e = [...hist].reverse().find((h) => h.status === s);
    return e ? new Date(e.at).toISOString() : undefined;
  };
  const status = isOrderStatus(o.fulfillmentStatus) ? o.fulfillmentStatus : "processing";
  const cancelled = status === "cancelled";
  const returnFlow = status === "return_requested" || status === "returned";

  // How far along the normal flow did it get? (cancelled orders stop at their last reached normal step)
  let reached = FLOW.indexOf(status as OrderStatus);
  if (cancelled || returnFlow) reached = returnFlow ? FLOW.length - 1 : Math.max(0, ...FLOW.map((s, i) => (when(s) ? i : 0)));
  if (reached < 0) reached = 0;

  const steps: TimelineStep[] = FLOW.map((s, i) => ({
    key: s,
    label: STATUS_LABEL[s],
    at: s === "processing" ? new Date(o.createdAt).toISOString() : when(s),
    state: cancelled ? (i <= reached ? "done" : "todo") : i < reached ? "done" : i === reached ? (status === "delivered" ? "done" : "current") : "todo",
  }));
  if (cancelled) steps.push({ key: "cancelled", label: "Cancelled", at: when("cancelled"), state: "bad", note: hist.find((h) => h.status === "cancelled")?.note });
  if (returnFlow) {
    steps.push({ key: "return_requested", label: "Return requested", at: when("return_requested"), state: status === "return_requested" ? "current" : "done", note: hist.find((h) => h.status === "return_requested")?.note });
    if (status === "returned") steps.push({ key: "returned", label: "Returned & refunded", at: when("returned"), state: "bad" });
  }
  return steps;
}

/** One-line status for lists and emails. */
export function statusSummary(status: string): string {
  return isOrderStatus(status) ? STATUS_LABEL[status] : status;
}
