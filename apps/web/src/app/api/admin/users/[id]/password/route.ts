import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isSuperAdminRequest } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSuperAdminRequest(req)) return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const password = (body.password ?? "").trim();
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
  if (password.length > 128) return NextResponse.json({ error: "Password too long" }, { status: 422 });

  try {
    await connectToDatabase();
    const hash = await bcrypt.hash(password, 12);
    const result = await User.findByIdAndUpdate(id, { passwordHash: hash }, { new: false }).select("_id").lean();
    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users/:id/password] POST failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
