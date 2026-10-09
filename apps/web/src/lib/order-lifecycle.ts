/**
 * Order lifecycle rules — PURE (no DB, safe to import in the browser and on the server).
 * The server enforces these on every change; the UI uses them to decide which buttons to show.
 *
 *   processing → confirmed → shipped → out_for_delivery → delivered
 *        ↘ cancelled (customer within 7 days, or admin)        ↘ return_requested → returned
 *                                                                  (admin may reject → back to delivered)
 *
 * Cancelling: before shipping the customer cancels instantly; once shipped (within 7 days of ordering) they send a
 * cancellation REQUEST which the admin approves (the courier has to be stopped / the parcel refused).
 * Admins can also step one stage back to fix a mis-click.
 */

export const ORDER_STATUSES = ["processing", "confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed", "delivered", "cancelled", "rto", "return_requested", "returned"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CANCEL_WINDOW_DAYS = 7;
export const RETURN_WINDOW_DAYS = 7;
const DAY = 86_400_000;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  on_hold: "On hold",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivery_failed: "Delivery attempt failed",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rto: "Returned to origin",
  return_requested: "Return requested",
  returned: "Returned",
};

/** What an admin may move an order to from each status (no going backwards; terminal states are final). */
export const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  processing: ["confirmed", "packed", "shipped", "on_hold", "cancelled"],
  confirmed: ["packed", "shipped", "on_hold", "cancelled", "processing"],
  packed: ["shipped", "on_hold", "cancelled", "confirmed"],
  on_hold: ["processing", "confirmed", "packed", "cancelled"], // resume or cancel
  shipped: ["out_for_delivery", "delivered", "delivery_failed", "cancelled", "packed", "confirmed"],
  out_for_delivery: ["delivered", "delivery_failed", "cancelled", "shipped"],
  delivery_failed: ["out_for_delivery", "delivered", "rto", "cancelled", "shipped"],
  delivered: ["returned", "out_for_delivery"],
  return_requested: ["returned", "delivered"], // "delivered" = return rejected
  cancelled: [],
  rto: [],
  returned: [],
};

/** Moving to one of these is a correction of an earlier step, not progress. */
export const BACKWARD: Partial<Record<OrderStatus, OrderStatus[]>> = {
  confirmed: ["processing"],
  packed: ["confirmed"],
  shipped: ["packed", "confirmed"],
  out_for_delivery: ["shipped"],
  delivery_failed: ["shipped"],
  delivered: ["out_for_delivery"],
};
export const isBackward = (from: string, to: string) => isOrderStatus(from) && isOrderStatus(to) && !!BACKWARD[from]?.includes(to);

export const isOrderStatus = (v: unknown): v is OrderStatus => typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);

export function canAdminTransition(from: string, to: string): boolean {
  return isOrderStatus(from) && isOrderStatus(to) && ADMIN_TRANSITIONS[from].includes(to);
}

const ts = (d: Date | string | number | undefined | null) => (d ? new Date(d).getTime() : NaN);

export interface Eligibility { ok: boolean; reason?: string; daysLeft?: number; /** 'direct' = cancels now; 'request' = needs admin approval (already shipped) */ mode?: "direct" | "request" }

/** Statuses where the customer's cancel is instant / only a request to the admin. */
export const DIRECT_CANCEL: string[] = ["processing", "confirmed", "packed", "on_hold"];
export const REQUEST_CANCEL: string[] = ["shipped", "out_for_delivery", "delivery_failed"];

/** Customers can cancel within 7 days of ordering: instantly before shipping, as a request to the admin once it has shipped. */
export function cancelEligibility(o: { fulfillmentStatus: string; createdAt: Date | string; cancelRequestedAt?: Date | string | null }, now = Date.now()): Eligibility {
  if (o.fulfillmentStatus === "cancelled") return { ok: false, reason: "This order is already cancelled." };
  const direct = DIRECT_CANCEL.includes(o.fulfillmentStatus);
  const request = REQUEST_CANCEL.includes(o.fulfillmentStatus);
  if (!direct && !request) {
    return { ok: false, reason: o.fulfillmentStatus === "delivered" ? "Delivered orders can be returned instead." : "This order can't be cancelled now." };
  }
  if (request && o.cancelRequestedAt) return { ok: false, reason: "You've already asked to cancel this order — we'll confirm shortly." };
  const elapsed = now - ts(o.createdAt);
  if (!(elapsed >= 0) || elapsed > CANCEL_WINDOW_DAYS * DAY) return { ok: false, reason: `The ${CANCEL_WINDOW_DAYS}-day cancellation window has passed.` };
  return { ok: true, mode: direct ? "direct" : "request", daysLeft: Math.max(0, Math.ceil((CANCEL_WINDOW_DAYS * DAY - elapsed) / DAY)) };
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

/**
 * The steps a customer sees in order tracking, in order. The admin status menu and the delivery portal offer exactly these
 * (with the same names from STATUS_LABEL) so all three screens always speak the same language.
 */
export const TRACKING_STAGES: readonly OrderStatus[] = ["processing", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
const FLOW = TRACKING_STAGES as OrderStatus[];

/**
 * Tracking steps for the order page. Done steps carry the time they were reached (from statusHistory);
 * on hold / failed delivery / returned-to-origin / cancelled / return states are appended as a final step.
 */
export function buildTimeline(o: { fulfillmentStatus: string; createdAt: Date | string; statusHistory?: HistoryEvent[] }): TimelineStep[] {
  const hist = o.statusHistory ?? [];
  const when = (s: string) => {
    const e = [...hist].reverse().find((h) => h.status === s);
    return e ? new Date(e.at).toISOString() : undefined;
  };
  const noteOf = (s: string) => [...hist].reverse().find((h) => h.status === s)?.note;
  const status = isOrderStatus(o.fulfillmentStatus) ? o.fulfillmentStatus : "processing";
  const returnFlow = status === "return_requested" || status === "returned";
  const sideStep = status === "cancelled" || status === "on_hold" || status === "delivery_failed" || status === "rto";

  // How far along the normal flow did it get?
  let reached = FLOW.indexOf(status as OrderStatus);
  if (returnFlow) reached = FLOW.length - 1;
  else if (status === "delivery_failed" || status === "rto") reached = Math.max(FLOW.indexOf("shipped"), ...FLOW.map((s, i) => (when(s) ? i : 0)));
  else if (sideStep) reached = Math.max(0, ...FLOW.map((s, i) => (when(s) ? i : 0)));
  if (reached < 0) reached = 0;

  const steps: TimelineStep[] = FLOW.map((s, i) => ({
    key: s,
    label: STATUS_LABEL[s],
    at: s === "processing" ? new Date(o.createdAt).toISOString() : when(s),
    state: sideStep ? (i <= reached ? "done" : "todo") : i < reached ? "done" : i === reached ? (status === "delivered" || returnFlow ? "done" : "current") : "todo",
  }));
  if (status === "cancelled") steps.push({ key: "cancelled", label: "Cancelled", at: when("cancelled"), state: "bad", note: noteOf("cancelled") });
  if (status === "rto") steps.push({ key: "rto", label: "Returned to origin", at: when("rto"), state: "bad", note: noteOf("rto") });
  if (status === "on_hold") steps.push({ key: "on_hold", label: "On hold", at: when("on_hold"), state: "current", note: noteOf("on_hold") });
  if (status === "delivery_failed") steps.push({ key: "delivery_failed", label: "Delivery attempt failed", at: when("delivery_failed"), state: "current", note: noteOf("delivery_failed") });
  if (returnFlow) {
    steps.push({ key: "return_requested", label: "Return requested", at: when("return_requested"), state: status === "return_requested" ? "current" : "done", note: noteOf("return_requested") });
    if (status === "returned") steps.push({ key: "returned", label: "Returned & refunded", at: when("returned"), state: "bad" });
  }
  return steps;
}

/** One-line status for lists and emails. */
export function statusSummary(status: string): string {
  return isOrderStatus(status) ? STATUS_LABEL[status] : status;
}
