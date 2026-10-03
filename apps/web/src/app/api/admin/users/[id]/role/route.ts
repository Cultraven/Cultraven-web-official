import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isSuperAdminRequest } from "@/lib/admin-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["customer", "admin", "delivery"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const role = body.role as typeof ALLOWED_ROLES[number];
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${ALLOWED_ROLES.join(", ")}` }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(id, { role }, { new: true })
      .select("_id role firstName lastName email")
      .lean() as any;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    console.error("[admin/users/:id/role] PATCH failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
