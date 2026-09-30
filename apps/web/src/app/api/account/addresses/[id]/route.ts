import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Address } from "@/lib/models/Address";
import { customerFromRequest } from "@/lib/customer-auth";
import { AddressInput, shape } from "@/lib/address-schema";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Every query is scoped by userId, so one customer can never read or change another's address (no IDOR). */
async function guard(req: Request, ctx: Ctx) {
  const me = customerFromRequest(req);
  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return { error: NextResponse.json({ error: "Invalid id" }, { status: 400 }) } as const;
  return { me, id } as const;
}

export async function PUT(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ("error" in g) return g.error;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  try {
    await connectToDatabase();
    // "Set as default" shortcut
    if (body && body.setDefault === true) {
      const exists = await Address.exists({ _id: g.id, userId: g.me.userId });
      if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await Address.updateMany({ userId: g.me.userId }, { $set: { isDefault: false } });
      await Address.updateOne({ _id: g.id, userId: g.me.userId }, { $set: { isDefault: true } });
      return NextResponse.json({ success: true });
    }
    const parsed = AddressInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
    if (parsed.data.isDefault) await Address.updateMany({ userId: g.me.userId }, { $set: { isDefault: false } });
    const doc = await Address.findOneAndUpdate({ _id: g.id, userId: g.me.userId }, { $set: parsed.data }, { new: true });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, address: shape(doc.toObject()) });
  } catch (e) {
    console.error("[addresses] PUT failed:", e);
    return NextResponse.json({ error: "Could not update the address" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ("error" in g) return g.error;
  try {
    await connectToDatabase();
    const removed = await Address.findOneAndDelete({ _id: g.id, userId: g.me.userId });
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (removed.isDefault) {
      const next = await Address.findOne({ userId: g.me.userId }).sort({ createdAt: -1 });
      if (next) await Address.updateOne({ _id: next._id }, { $set: { isDefault: true } });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[addresses] DELETE failed:", e);
    return NextResponse.json({ error: "Could not delete the address" }, { status: 500 });
  }
}
