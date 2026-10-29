import mongoose from "mongoose";

/** Someone who asked, on the website, to hear about new drops. One row per email address. */
const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    source: { type: String, default: "website", maxlength: 40 },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
