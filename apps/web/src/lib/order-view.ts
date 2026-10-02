/** Shapes an Order document for the signed-in customer (no internal fields) and validates order ids. */
import mongoose from "mongoose";
import { cancelEligibility, returnEligibility, buildTimeline, type HistoryEvent } from "@/lib/order-lifecycle";
import { orderNumber, type MailOrder } from "@/lib/email-templates";

/** True only for a canonical 24-hex ObjectId string. */
export const validId = (id: string) => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id) && mongoose.isValidObjectId(id);

export function customerOrderView(o: any) {
  const history: HistoryEvent[] = (o.statusHistory ?? []).map((h: any) => ({ status: h.status, note: h.note, at: h.at, by: h.by }));
  return {
    id: String(o._id),
    number: orderNumber(String(o._id)),
    createdAt: o.createdAt,
    status: o.fulfillmentStatus,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    items: (o.items ?? []).map((i: any) => ({ productId: i.productId, sku: i.sku, title: i.title, image: i.image, size: i.size, color: i.color ?? "", quantity: i.quantity, pricePaise: i.pricePaise })),
    subtotalPaise: o.subtotalPaise,
    discountPaise: o.discountPaise ?? 0,
    shippingPaise: o.shippingPaise ?? 0,
    codFeePaise: o.codFeePaise ?? 0,
    totalPaise: o.totalPaise,
    address: { name: o.deliveryAddress?.name, line1: o.deliveryAddress?.line1, line2: o.deliveryAddress?.line2 ?? "", city: o.deliveryAddress?.city, state: o.deliveryAddress?.state, pincode: o.deliveryAddress?.pincode, phone: o.deliveryAddress?.phone },
    tracking: { courier: o.courierName ?? "", number: o.trackingNumber ?? "", url: o.trackingUrl ?? "" },
    deliveredAt: o.deliveredAt ?? null,
    cancelReason: o.cancelReason ?? "",
    cancelRequested: !!o.cancelRequestedAt,
    cancelRequestReason: o.cancelRequestReason ?? "",
    returnReason: o.returnReason ?? "",
    timeline: buildTimeline({ fulfillmentStatus: o.fulfillmentStatus, createdAt: o.createdAt, statusHistory: history }),
    history: history.slice().reverse(),
    canCancel: cancelEligibility({ fulfillmentStatus: o.fulfillmentStatus, createdAt: o.createdAt, cancelRequestedAt: o.cancelRequestedAt }),
    canReturn: returnEligibility({ fulfillmentStatus: o.fulfillmentStatus, deliveredAt: o.deliveredAt }),
  };
}

/** Order → the shape the email + PDF builders use. */
export function toMailOrder(o: any): MailOrder & { razorpayPaymentId?: string } {
  return {
    id: String(o._id), createdAt: o.createdAt, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    items: o.items, subtotalPaise: o.subtotalPaise, discountPaise: o.discountPaise ?? 0, shippingPaise: o.shippingPaise ?? 0,
    codFeePaise: o.codFeePaise ?? 0, totalPaise: o.totalPaise, deliveryAddress: o.deliveryAddress, razorpayPaymentId: o.razorpayPaymentId,
  };
}
