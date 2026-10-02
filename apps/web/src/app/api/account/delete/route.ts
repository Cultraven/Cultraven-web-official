/**
 * POST /api/account/delete — SOFT-delete the signed-in customer's account.
 *
 * Body: { "confirm": "DELETE", "password": "<current password>" }
 *
 * The user document is kept (orders are retained for accounting and are NOT anonymised), but:
 *  deletedAt = now, status = "deleted", avatar blanked, the old address copied to `deletedEmail`,
 *  and `email` renamed to deleted+<id>@deleted.invalid so the real address can be registered again.
 * The session cookie is cleared; every customer-auth path then treats the account as signed out.
 */
import { NextRequest } from "next/server";
import { User } from "@/lib/models/User";
import { activeCustomerFromRequest } from "@/lib/customer-auth";
import { DeleteAccountSchema } from "@/lib/profile-schema";
import { buildSoftDeleteUpdate } from "@/lib/account-delete";
import { verifyPassword } from "@/lib/password";
import { clearSessionCookie, json, unauthorized } from "@/lib/account-api";
import { isSameOrigin, parseJsonBody, rateLimitPeek, recordHit, resetRateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const body = await parseJsonBody(req, 2 * 1024);
  if (!body.ok) return json({ error: body.error }, body.status);

  const parsed = DeleteAccountSchema.safeParse(body.data);
  if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, 422);

  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();
    const failKey = `acct-del-fail:${me.userId}`;
    const locked = rateLimitPeek(failKey, MAX_FAILS, FAIL_WINDOW_MS);
    if (!locked.ok) return json({ error: "Too many attempts. Try again in a few minutes." }, 429, retryHeaders(locked));

    const user = (await User.findOne({ _id: me.userId, deletedAt: null }).select("+passwordHash email").lean()) as any;
    if (!user) return unauthorized();

    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      recordHit(failKey, FAIL_WINDOW_MS); // only wrong guesses count
      return json({ error: "Incorrect password.", issues: { password: ["Incorrect password."] } }, 422);
    }

    // deletedAt: null in the filter makes a double-submit a no-op instead of renaming the email twice.
    const r = await User.updateOne({ _id: user._id, deletedAt: null }, buildSoftDeleteUpdate({ _id: user._id, email: user.email }));
    if (!r.modifiedCount) return unauthorized();

    resetRateLimit(failKey);
    return clearSessionCookie(json({ ok: true }));
  } catch (e) {
    console.error("[account/delete]", e instanceof Error ? e.message : e);
    return json({ error: "Could not delete your account. Please try again." }, 500);
  }
}
