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
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus: "processing" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned";
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  statusHistory: StatusEvent[];
  notes?: string;
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
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "processing",
    },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    courierName: { type: String },
    statusHistory: { type: [StatusEventSchema], default: [] },
    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ razorpayOrderId: 1 }, { unique: true });
OrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

// ── Virtual: order number (human-readable) ────────────────────────────────────
OrderSchema.virtual("orderNumber").get(function (this: IOrder) {
  const id = (this._id as mongoose.Types.ObjectId).toString();
  return `CR-${id.slice(-6).toUpperCase()}`;
});

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
