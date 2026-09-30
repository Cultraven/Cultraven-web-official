import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Address } from "@/lib/models/Address";
import { customerFromRequest } from "@/lib/customer-auth";
import { AddressInput, shape } from "@/lib/address-schema";

export const dynamic = "force-dynamic";

/** The signed-in customer's saved addresses. */
export async function GET(req: Request) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const docs = await Address.find({ userId: me.userId }).sort({ isDefault: -1, createdAt: -1 }).limit(20).lean();
    return NextResponse.json({ addresses: docs.map(shape) });
  } catch (e) {
    console.error("[addresses] GET failed:", e);
    return NextResponse.json({ error: "Addresses unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = AddressInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    await connectToDatabase();
    if ((await Address.countDocuments({ userId: me.userId })) >= 10) return NextResponse.json({ error: "You can save up to 10 addresses" }, { status: 400 });
    const first = (await Address.countDocuments({ userId: me.userId })) === 0;
    const makeDefault = parsed.data.isDefault || first;
    if (makeDefault) await Address.updateMany({ userId: me.userId }, { $set: { isDefault: false } });
    const doc = await Address.create({ ...parsed.data, isDefault: makeDefault, userId: me.userId });
    return NextResponse.json({ success: true, address: shape(doc.toObject()) }, { status: 201 });
  } catch (e) {
    console.error("[addresses] POST failed:", e);
    return NextResponse.json({ error: "Could not save the address" }, { status: 500 });
  }
}
