/**
 * GET   /api/account/profile — the signed-in customer's profile (never includes the avatar image bytes).
 * PATCH /api/account/profile — update first name, last name and phone ({ firstName, lastName, phone? }).
 */
import { NextRequest } from "next/server";
import { User } from "@/lib/models/User";
import { activeCustomerFromRequest } from "@/lib/customer-auth";
import { ProfileUpdateSchema } from "@/lib/profile-schema";
import { avatarUrl } from "@/lib/avatar-url";
import { json, unauthorized } from "@/lib/account-api";
import { isSameOrigin, parseJsonBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const shape = (u: any) => {
  const version = u.avatarUpdatedAt ? new Date(u.avatarUpdatedAt).getTime() : null;
  return { firstName: u.firstName ?? "", lastName: u.lastName ?? "", email: u.email, phone: u.phone ?? "", avatar: avatarUrl(version), avatarVersion: version };
};

export async function GET(req: NextRequest) {
  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();
    const u = await User.findById(me.userId).select("firstName lastName email phone avatarUpdatedAt").lean();
    if (!u) return unauthorized();
    return json({ profile: shape(u) });
  } catch (e) {
    console.error("[account/profile GET]", e instanceof Error ? e.message : e);
    return json({ error: "Could not load your profile. Please try again." }, 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const body = await parseJsonBody(req, 4 * 1024);
  if (!body.ok) return json({ error: body.error }, body.status);

  const parsed = ProfileUpdateSchema.safeParse(body.data);
  if (!parsed.success) return json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, 422);
  const { firstName, lastName, phone } = parsed.data;

  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();

    const update: Record<string, any> = { $set: { firstName, lastName } };
    if (phone === "") update.$unset = { phone: "" };
    else if (phone !== undefined) update.$set.phone = phone;

    const u = await User.findOneAndUpdate({ _id: me.userId, deletedAt: null }, update, { new: true, runValidators: true })
      .select("firstName lastName email phone avatarUpdatedAt")
      .lean();
    if (!u) return unauthorized();
    return json({ ok: true, profile: shape(u) });
  } catch (e) {
    console.error("[account/profile PATCH]", e instanceof Error ? e.message : e);
    return json({ error: "Could not save your profile. Please try again." }, 500);
  }
}
