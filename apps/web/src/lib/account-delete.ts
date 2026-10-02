/**
 * Soft-delete helpers for customer accounts (pure, no DB access — unit tested).
 *
 * A "deleted" customer is kept in the users collection (orders reference them for accounting) but:
 *  - can no longer sign in or use any customer API,
 *  - has their email address renamed to an unroutable placeholder so the real address can be registered again,
 *  - has the original address kept in `deletedEmail` for support / legal retention,
 *  - has their profile photo removed.
 */

export const DELETED_EMAIL_DOMAIN = "deleted.invalid";

/** Placeholder email for a soft-deleted user: `deleted+<id>@deleted.invalid` (unique per user id, valid per the User email regex). */
export function deletedEmailFor(id: string): string {
  const clean = String(id ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean) throw new Error("deletedEmailFor: a user id is required");
  return `deleted+${clean}@${DELETED_EMAIL_DOMAIN}`;
}

/** True for a placeholder produced by {@link deletedEmailFor}. */
export function isDeletedEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && /^deleted\+[a-z0-9]+@deleted\.invalid$/.test(email.trim().toLowerCase());
}

export interface SoftDeletableUser { deletedAt?: Date | string | null; status?: string | null }

/** A user may sign in / use customer APIs only when not soft-deleted. Legacy users (no deletedAt/status fields) are active. */
export function isUserActive(u: SoftDeletableUser | null | undefined): boolean {
  if (!u) return false;
  if (u.deletedAt) return false;
  if (u.status === "deleted") return false;
  return true;
}

/** Mongo update that soft-deletes `user` (use with `updateOne({ _id, deletedAt: null }, update)`). */
export function buildSoftDeleteUpdate(user: { _id: unknown; email: string }, now: Date = new Date()) {
  return {
    $set: {
      deletedAt: now,
      status: "deleted" as const,
      deletedEmail: user.email,
      email: deletedEmailFor(String(user._id)),
      avatar: "",
      avatarUpdatedAt: null,
    },
  };
}

/** Exact phrase the customer must type to confirm deletion. */
export const DELETE_CONFIRM_PHRASE = "DELETE";
