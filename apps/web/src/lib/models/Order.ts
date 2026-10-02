/**
 * Order model — Mongoose schema.
 *
 * Represents a placed order: items, pricing, Razorpay IDs,
 * delivery address, status history, and tracking info.
 */

import mongoose, { Schema, model, models, Document } from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string;
  sku: string;
  title: string;
  image: string;
  size: string;
  color: string;
  pricePaise: number;
  quantity: number;
}

interface DeliveryAddress {
  name: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface StatusEvent {
  status: string;
  note?: string;
  at: Date;
  /** Who made the change: the customer, an admin, or the system (payments). */
  by?: "customer" | "admin" | "system";
}

export interface IOrder extends Document {
  userId: string;
  items: OrderItem[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  totalPaise: number;
  couponCode?: string;
  deliveryAddress: DeliveryAddress;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refund_pending" | "refunded";
  fulfillmentStatus: "processing" | "confirmed" | "packed" | "on_hold" | "shipped" | "out_for_delivery" | "delivery_failed" | "delivered" | "cancelled" | "rto" | "return_requested" | "returned";
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string;
  /** Private notes for the team - never shown to the customer. */
  adminNotes?: { text: string; at: Date }[];
  /** Set when a customer asks to cancel an order that has already shipped; the admin approves or ignores it. */
  cancelRequestedAt?: Date | null;
  cancelRequestReason?: string;
  returnReason?: string;
  returnRequestedAt?: Date | null;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  statusHistory: StatusEvent[];
  notes?: string;
  /** Set once the "order placed" emails have been sent (prevents duplicates). */
  emailNotifiedAt?: Date | null;
  /** Per-size stock was reserved for this order, and when it was given back (cancel / return / RTO). */
  stockReserved?: boolean;
  stockReleasedAt?: Date | null;
  /** Client-generated key so a double-click / retry can't create two orders. */
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>({
  productId: { type: String, required: true },
  sku: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, default: "" },
  pricePaise: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const AddressSchema = new Schema<DeliveryAddress>({
  name: { type: String, required: true },
  email: { type: String },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true, match: /^\d{6}$/ },
  phone: { type: String, required: true, match: /^\d{10}$/ },
}, { _id: false });

const StatusEventSchema = new Schema<StatusEvent>({
  status: { type: String, required: true },
  note: { type: String },
  at: { type: Date, default: Date.now },
  by: { type: String, enum: ["customer", "admin", "system"] },
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true, index: true },
    items: { type: [OrderItemSchema], required: true, validate: [(v: OrderItem[]) => v.length > 0, "Order must have at least one item"] },
    subtotalPaise: { type: Number, required: true, min: 0 },
    discountPaise: { type: Number, default: 0, min: 0 },
    shippingPaise: { type: Number, default: 0, min: 0 },
    codFeePaise: { type: Number, default: 0, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
    couponCode: { type: String },
    deliveryAddress: { type: AddressSchema, required: true },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String },
    paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refund_pending", "refunded"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["processing", "confirmed", "packed", "on_hold", "shipped", "out_for_delivery", "delivery_failed", "delivered", "cancelled", "rto", "return_requested", "returned"],
      default: "processing",
    },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    courierName: { type: String },
    statusHistory: { type: [StatusEventSchema], default: [] },
    notes: { type: String, maxlength: 500 },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, maxlength: 300 },
    adminNotes: { type: [new Schema({ text: { type: String, maxlength: 500, required: true }, at: { type: Date, default: Date.now } }, { _id: false })], default: [] },
    cancelRequestedAt: { type: Date, default: null },
    cancelRequestReason: { type: String, maxlength: 300 },
    returnReason: { type: String, maxlength: 300 },
    returnRequestedAt: { type: Date, default: null },
    emailNotifiedAt: { type: Date, default: null },
    stockReserved: { type: Boolean, default: false },
    stockReleasedAt: { type: Date, default: null },
    idempotencyKey: { type: String, maxlength: 80 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
OrderSchema.index({ userId: 1, createdAt: -1 });
// razorpayOrderId is already indexed (unique + sparse) on the field; a second non-sparse unique index would
// make every COD order (no Razorpay id) collide on null.
OrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });
// One order per (customer, checkout attempt); partial so orders without a key are unaffected.
OrderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });

// ── Virtual: order number (human-readable) ────────────────────────────────────
OrderSchema.virtual("orderNumber").get(function (this: IOrder) {
  const id = (this._id as mongoose.Types.ObjectId).toString();
  return `CR-${id.slice(-6).toUpperCase()}`;
});

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
