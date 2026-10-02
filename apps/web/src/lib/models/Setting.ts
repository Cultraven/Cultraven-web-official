import mongoose from "mongoose";

/** Admin-editable site settings, one document per key (e.g. "smtp"). Secrets inside are stored encrypted. */
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

/** Outbound email attempts (no bodies, no secrets): lets the admin see what was sent and why something failed. */
const EmailLogSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true },
    error: { type: String, default: "" },
    orderId: { type: String, default: "" },
  },
  { timestamps: true }
);
EmailLogSchema.index({ createdAt: -1 });

export const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);
