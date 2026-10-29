/**
 * Adds someone to the drop-alert list without ever creating a duplicate.
 * "The same person" = the same inbox (see canonicalEmail), so a.b@gmail.com / ab+promo@Gmail.com do not make a second row.
 * Two safety nets: the lookup below, and unique indexes on `email` and `canonical` that make the database refuse a second row even when
 * two sign-ups arrive at the same instant (that refusal is treated as "already on the list", not as an error).
 */
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { canonicalEmail, isDuplicateKeyError } from "@/lib/subscribers";

export interface AddSubscriberInput { email: string; interest?: string; page?: string; note?: string; source: "website" | "admin"; resubscribe?: boolean }
export interface AddSubscriberResult {
  /** A brand-new row was created. */
  created: boolean;
  /** An existing row marked "unsubscribed" was switched back on (only when `resubscribe` is set). */
  resubscribed: boolean;
}

export async function addSubscriber(input: AddSubscriberInput): Promise<AddSubscriberResult> {
  const email = input.email.trim().toLowerCase();
  const canonical = canonicalEmail(email);
  const same = { $or: [{ canonical }, { email }] };
  const fields = { email, canonical, source: input.source, interest: input.interest ?? "", page: input.page ?? "", note: input.note ?? "", status: "subscribed" };

  let created = false;
  try {
    const res = await NewsletterSubscriber.updateOne(same, { $setOnInsert: fields }, { upsert: true });
    created = Boolean(res?.upsertedCount);
  } catch (e) {
    if (!isDuplicateKeyError(e)) throw e; // someone else saved the same person a moment ago: that is fine, they are on the list
  }
  if (created) return { created: true, resubscribed: false };

  // Already on the list. A row saved before the same-person key existed gets its key now.
  try { await NewsletterSubscriber.updateOne({ email, canonical: { $exists: false } }, { $set: { canonical } }); } catch { /* best effort */ }

  let resubscribed = false;
  if (input.resubscribe) {
    const back = await NewsletterSubscriber.updateOne({ ...same, status: "unsubscribed" }, { $set: { status: "subscribed", interest: input.interest ?? "", page: input.page ?? "" } });
    resubscribed = Boolean(back?.modifiedCount);
  }
  return { created: false, resubscribed };
}
