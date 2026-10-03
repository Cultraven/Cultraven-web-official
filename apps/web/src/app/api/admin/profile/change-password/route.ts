import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, getAdminUserId } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = getAdminUserId(req);

  if (!userId || userId === "env-admin") {
    return NextResponse.json({ error: "Super admin credentials are set via environment variables and cannot be changed here." }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 422 });

  const { currentPassword, newPassword } = parsed.data;

  try {
    await connectToDatabase();
    const user = await User.findById(userId).select("+passwordHash").lean() as any;
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    const hash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { $set: { passwordHash: hash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/profile/change-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}
