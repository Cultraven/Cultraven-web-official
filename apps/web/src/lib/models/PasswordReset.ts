/**
 * One row per password-reset (or "set your password") link we email. Only a SHA-256 hash of the token is stored, so a
 * copy of the database can't be used to reset anyone's password. A row is single-use (`usedAt`) and expires
 * (`expiresAt`); MongoDB deletes it a day after it expires.
 */
import { Schema, model, models } from "mongoose";

const PasswordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    /** "reset" = the customer asked via "Forgot password"; "invite" = a new account's "set your password" link. */
    purpose: { type: String, enum: ["reset", "invite"], default: "reset" },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    requestIp: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
PasswordResetSchema.index({ tokenHash: 1 }, { unique: true });
PasswordResetSchema.index({ userId: 1, purpose: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const PasswordReset = models.PasswordReset || model("PasswordReset", PasswordResetSchema);
