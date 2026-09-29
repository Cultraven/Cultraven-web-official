/**
 * Address model — Mongoose schema.
 *
 * Saved delivery addresses per user.
 * Linked by userId; default address stored at user level.
 */

import { Schema, model, models, Document } from "mongoose";

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
      maxlength: 100,
    },
    line1: {
      type: String,
      required: [true, "Address line 1 required"],
      trim: true,
      maxlength: 200,
    },
    line2: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      required: [true, "City required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode required"],
      match: [/^\d{6}$/, "Pincode must be 6 digits"],
    },
    phone: {
      type: String,
      required: [true, "Phone required"],
      match: [/^\d{10}$/, "Phone must be 10 digits"],
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

AddressSchema.index({ userId: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });

export const Address = models.Address || model<IAddress>("Address", AddressSchema);
