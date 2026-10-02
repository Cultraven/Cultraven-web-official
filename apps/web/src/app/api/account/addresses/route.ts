import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Address } from "@/lib/models/Address";
import { customerFromRequest } from "@/lib/customer-auth";
import { AddressInput, shape } from "@/lib/address-schema";
import { apiError, isSameOrigin, readJsonBody, unprocessable } from "@/lib/address-api";

export const dynamic = "force-dynamic";

/** Per-customer cap (route files may only export HTTP handlers, so this stays module-private). */
const MAX_ADDRESSES = 10;

/** The signed-in customer's saved addresses. */
export async function GET(req: Request) {
  const me = customerFromRequest(req);
  if (!me) return apiError(401, "Unauthorized");
  try {
    await connectToDatabase();
    const docs = await Address.find({ userId: me.userId }).sort({ isDefault: -1, createdAt: -1 }).limit(MAX_ADDRESSES * 2).lean();
    return NextResponse.json({ addresses: docs.map(shape), max: MAX_ADDRESSES });
  } catch (e) {
    console.error("[addresses] GET failed:", e instanceof Error ? e.name : "error");
    return apiError(503, "Addresses unavailable");
  }
}

/** Add an address. Body is validated by zod (strict types + India rules incl. pincode/state) before any query runs. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return apiError(403, "Forbidden");
  const me = customerFromRequest(req);
  if (!me) return apiError(401, "Unauthorized");

  const raw = await readJsonBody(req);
  if (!raw.ok) return raw.res;
  const parsed = AddressInput.safeParse(raw.body);
  if (!parsed.success) return unprocessable(parsed.error);

  try {
    await connectToDatabase();
    const count = await Address.countDocuments({ userId: me.userId });
    if (count >= MAX_ADDRESSES) return apiError(400, `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`, { code: "LIMIT" });

    const makeDefault = parsed.data.isDefault || count === 0;
    // Create first, demote the others afterwards: a failed insert can never leave the customer without a default.
    const doc = await Address.create({ ...parsed.data, isDefault: makeDefault, userId: me.userId });
    if (makeDefault) await Address.updateMany({ userId: me.userId, _id: { $ne: doc._id } }, { $set: { isDefault: false } });

    // Two simultaneous requests can both pass the count check — enforce the cap again after the insert.
    if ((await Address.countDocuments({ userId: me.userId })) > MAX_ADDRESSES) {
      await Address.deleteOne({ _id: doc._id, userId: me.userId });
      return apiError(400, `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`, { code: "LIMIT" });
    }
    return NextResponse.json({ success: true, address: shape(doc.toObject()) }, { status: 201 });
  } catch (e) {
    console.error("[addresses] POST failed:", e instanceof Error ? e.name : "error");
    return apiError(500, "Could not save the address");
  }
}
