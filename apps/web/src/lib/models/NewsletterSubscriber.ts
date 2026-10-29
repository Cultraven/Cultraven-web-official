import mongoose from "mongoose";

/**
 * Someone who asked, on the website, to hear about new drops ("Notify me" boxes and the footer form). One row per email address.
 * The shop owner sees and manages these in Admin -> Subscribers.
 */
const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    /** Same-person key (see canonicalEmail): one row per real inbox, even if typed with dots, +tags or other capitals. Unique, so the database itself refuses a duplicate. */
    canonical: { type: String, unique: true, sparse: true, lowercase: true, trim: true, maxlength: 254 },
    /** "website" (visitor), "admin" (added by hand in the admin). */
    source: { type: String, default: "website", maxlength: 40 },
    /** What they asked to hear about, e.g. "New Drop" or "Collection: Hoodies". Empty = general. */
    interest: { type: String, default: "", maxlength: 60 },
    /** The page they signed up on, e.g. "/collections/hoodies". */
    page: { type: String, default: "", maxlength: 120 },
    /** "unsubscribed" people stay on file (so they are not added again by mistake) but are left out of announcements. */
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
    /** Private note for the team. */
    note: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
