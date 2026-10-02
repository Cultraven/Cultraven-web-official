/**
 * GET /api/account/session — tiny "who am I" for the site header (never an error for visitors).
 *  { signedIn: false }                                   no / invalid / expired session, or a soft-deleted account
 *  { signedIn: true, initial: "J", name: "Jitesh", avatar: "/api/account/avatar?v=..." | null }
 * No avatar bytes are ever included — the header loads the image from `avatar` (cacheable, ETag).
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { customerFromRequest } from "@/lib/customer-auth";
import { isUserActive } from "@/lib/account-delete";
import { avatarUrl } from "@/lib/avatar-url";
import { clearSessionCookie, json } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = customerFromRequest(req);
  if (!session) return json({ signedIn: false });
  try {
    await connectToDatabase();
    const u = (await User.findById(session.userId).select("firstName email avatarUpdatedAt deletedAt status").lean()) as any;
    if (u && !isUserActive(u)) return clearSessionCookie(json({ signedIn: false })); // deleted elsewhere: drop the stale cookie
    const first = (u?.firstName || "").trim();
    const initial = (first || u?.email || session.email || "C").trim().charAt(0).toUpperCase() || "C";
    const version = u?.avatarUpdatedAt ? new Date(u.avatarUpdatedAt).getTime() : null;
    return json({ signedIn: true, initial, name: first, avatar: avatarUrl(version) });
  } catch {
    // Database hiccup: the cookie is valid, so show the signed-in state from what the cookie knows.
    return json({ signedIn: true, initial: (session.email || "C").trim().charAt(0).toUpperCase() || "C", name: "", avatar: null });
  }
}
