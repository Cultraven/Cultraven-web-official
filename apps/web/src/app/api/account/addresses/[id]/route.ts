import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Address } from "@/lib/models/Address";
import { customerFromRequest } from "@/lib/customer-auth";
import { AddressInput, shape } from "@/lib/address-schema";
import { OBJECT_ID_RE, apiError, isSameOrigin, readJsonBody, unprocessable } from "@/lib/address-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Every query is scoped by userId (taken from the signed session, never from the request), so one customer can never read or
 * change another's address (no IDOR). The id must be exactly 24 hex characters before it reaches Mongoose.
 */
async function guard(req: Request, ctx: Ctx) {
  if (!isSameOrigin(req)) return { error: apiError(403, "Forbidden") } as const; // state-changing: CSRF defence in depth (cookie is also SameSite=Lax)
  const me = customerFromRequest(req);
  if (!me) return { error: apiError(401, "Unauthorized") } as const;
  const { id } = await ctx.params;
  if (typeof id !== "string" || !OBJECT_ID_RE.test(id) || !mongoose.isValidObjectId(id)) return { error: apiError(400, "Invalid id") } as const;
  return { me, id } as const;
}

export async function PUT(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ("error" in g) return g.error;
  const raw = await readJsonBody(req);
  if (!raw.ok) return raw.res;
  const body = raw.body;

  try {
    // "Set as default" shortcut: exactly {"setDefault": true}
    if (body && typeof body === "object" && !Array.isArray(body) && (body as any).setDefault === true && Object.keys(body).length === 1) {
      await connectToDatabase();
      const exists = await Address.exists({ _id: g.id, userId: g.me.userId });
      if (!exists) return apiError(404, "Not found");
      await Address.updateOne({ _id: g.id, userId: g.me.userId }, { $set: { isDefault: true } });
      await Address.updateMany({ userId: g.me.userId, _id: { $ne: g.id } }, { $set: { isDefault: false } });
      return NextResponse.json({ success: true });
    }

    const parsed = AddressInput.safeParse(body);
    if (!parsed.success) return unprocessable(parsed.error);

    await connectToDatabase();
    // Un-ticking "default" on the current default must not leave the book without one: only ever promote here.
    const { isDefault, ...fields } = parsed.data;
    const doc = await Address.findOneAndUpdate({ _id: g.id, userId: g.me.userId }, { $set: isDefault ? { ...fields, isDefault: true } : fields }, { new: true });
    if (!doc) return apiError(404, "Not found");
    if (isDefault) await Address.updateMany({ userId: g.me.userId, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
    return NextResponse.json({ success: true, address: shape(doc.toObject()) });
  } catch (e) {
    console.error("[addresses] PUT failed:", e instanceof Error ? e.name : "error");
    return apiError(500, "Could not update the address");
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if ("error" in g) return g.error;
  try {
    await connectToDatabase();
    const removed = await Address.findOneAndDelete({ _id: g.id, userId: g.me.userId });
    if (!removed) return apiError(404, "Not found");
    if (removed.isDefault) {
      const next = await Address.findOne({ userId: g.me.userId }).sort({ createdAt: -1 });
      if (next) await Address.updateOne({ _id: next._id, userId: g.me.userId }, { $set: { isDefault: true } });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[addresses] DELETE failed:", e instanceof Error ? e.name : "error");
    return apiError(500, "Could not delete the address");
  }
}
