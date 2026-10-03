/**
 * Delivery partner KYC documents.
 * Images stored as base64 data URLs (select: false — never returned by default).
 * Referenced by userId; one document per delivery partner.
 */
import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface IDeliveryKyc extends Document {
  userId: Types.ObjectId;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber: string;
  selfieDataUrl?: string;
  aadhaarFrontDataUrl?: string;
  aadhaarBackDataUrl?: string;
  panDataUrl?: string;
  submittedAt: Date;
  updatedAt: Date;
}

const DeliveryKycSchema = new Schema<IDeliveryKyc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    phone: { type: String, required: true, match: [/^\d{10}$/, "Phone must be 10 digits"] },
    address: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    pincode: { type: String, required: true, match: [/^\d{6}$/, "Pincode must be 6 digits"] },
    aadhaarNumber: { type: String, required: true, match: [/^\d{12}$/, "Aadhaar must be 12 digits"], select: false },
    panNumber: { type: String, required: true, match: [/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN"], uppercase: true },
    selfieDataUrl: { type: String, select: false },
    aadhaarFrontDataUrl: { type: String, select: false },
    aadhaarBackDataUrl: { type: String, select: false },
    panDataUrl: { type: String, select: false },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

DeliveryKycSchema.index({ userId: 1 }, { unique: true });

export const DeliveryKyc = models.DeliveryKyc || model<IDeliveryKyc>("DeliveryKyc", DeliveryKycSchema);
