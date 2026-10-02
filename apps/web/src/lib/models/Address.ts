/**
 * Address model — Mongoose schema.
 *
 * Saved delivery addresses per user (max 10, enforced in the API). Field rules mirror lib/address-validation.ts —
 * the API validates with zod first; these are the last line of defence for anything that writes through Mongoose directly.
 */

import { Schema, model, models, Document } from "mongoose";
import { INDIA_STATES } from "@/lib/address-validation";

export interface IAddress extends Document {
  userId: string;
  label: "Home" | "Work" | "Other";
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    name: {
      type: String,
      required: [true, "Name required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    line1: {
      type: String,
      required: [true, "Address line 1 required"],
      trim: true,
      minlength: 5,
      maxlength: 150,
    },
    line2: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      required: [true, "City required"],
      trim: true,
      maxlength: 60,
    },
    state: {
      type: String,
      required: [true, "State required"],
      trim: true,
      enum: INDIA_STATES as unknown as string[],
    },
    pincode: {
      type: String,
      required: [true, "Pincode required"],
      match: [/^[1-9]\d{5}$/, "Pincode must be 6 digits"],
    },
    phone: {
      type: String,
      required: [true, "Phone required"],
      match: [/^[6-9]\d{9}$/, "Phone must be a 10-digit Indian mobile number"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

AddressSchema.index({ userId: 1, isDefault: 1 });

export const Address = models.Address || model<IAddress>("Address", AddressSchema);
