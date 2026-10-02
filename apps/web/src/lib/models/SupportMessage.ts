import mongoose from "mongoose";

/** A message sent through the Contact us form. Saved so nothing is lost even if email isn't set up. */
const SupportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 254 },
    phone: { type: String, default: "", maxlength: 20 },
    subject: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 2000 },
    /** Order number the customer mentioned (e.g. CR-1A2B3C), if any. */
    orderRef: { type: String, default: "", maxlength: 20 },
    /** Signed-in customer who sent it, if any. */
    userId: { type: String, default: "" },
    status: { type: String, enum: ["new", "open", "resolved"], default: "new", index: true },
  },
  { timestamps: true }
);
SupportMessageSchema.index({ createdAt: -1 });

export const SupportMessage = mongoose.models.SupportMessage || mongoose.model("SupportMessage", SupportMessageSchema);
export const supportRef = (id: string) => `HLP-${String(id).slice(-6).toUpperCase()}`;
