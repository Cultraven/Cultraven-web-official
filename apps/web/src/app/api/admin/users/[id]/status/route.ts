import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isAdminRequest } from "@/lib/admin-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const status = body.status;
  if (status !== "active" && status !== "deleted") {
    return NextResponse.json({ error: "status must be 'active' or 'deleted'" }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const update: Record<string, any> = { status };
    if (status === "deleted") update.deletedAt = new Date();
    else update.deletedAt = null;

    const result = await User.findByIdAndUpdate(id, update, { new: true })
      .select("_id status deletedAt")
      .lean() as any;
    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ok: true, status: result.status, deletedAt: result.deletedAt ?? null });
  } catch (err) {
    console.error("[admin/users/:id/status] PATCH failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
