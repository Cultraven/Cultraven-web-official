/**
 * User model — Mongoose schema.
 *
 * Stores customer account data.
 * Passwords are hashed by the auth-service; we never store plaintext.
 * Indexes: email (unique), phone (sparse), deletedAt.
 *
 * Soft delete: a customer who deletes their account keeps their document (orders reference it for accounting)
 * with `deletedAt` set, `status: "deleted"`, the original address in `deletedEmail` and `email` renamed to
 * `deleted+<id>@deleted.invalid` so the real address can be registered again. See lib/account-delete.ts.
 */

import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "customer" | "admin" | "superadmin" | "delivery";
  emailVerified: boolean;
  /** Profile photo as a data URL (jpeg/png/webp, <= 150 KB). Never selected by default — select("+avatar") where needed. */
  avatar?: string;
  /** When the avatar last changed (cache-busting version; safe to select everywhere, carries no image bytes). */
  avatarUpdatedAt?: Date | null;
  status: "active" | "deleted";
  deletedAt?: Date | null;
  /** The email the customer had before deleting their account (support / legal retention). */
  deletedEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name too long"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      sparse: true,
      match: [/^\d{10}$/, "Phone must be 10 digits"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ["customer", "admin", "superadmin", "delivery"],
      default: "customer",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
      select: false, // up to ~200 KB of base64 — never returned by default
      maxlength: [210000, "Avatar too large"],
    },
    avatarUpdatedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedEmail: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ deletedAt: 1 });

// ── Virtual: full name ────────────────────────────────────────────────────────
UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Dev only: a hot-reloaded server keeps the previously compiled model, which would silently drop the soft-delete / avatar fields.
if (process.env.NODE_ENV !== "production" && models.User && !models.User.schema.path("deletedAt")) {
  mongoose.deleteModel("User");
}

export const User = models.User || model<IUser>("User", UserSchema);
