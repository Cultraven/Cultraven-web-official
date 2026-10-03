import { NextRequest, NextResponse } from "next/server";
import { getAdminRole, getAdminUserId } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Setting } from "@/lib/models/Setting";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const role = getAdminRole(req);
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = getAdminUserId(req);

  try {
    await connectToDatabase();

    if (userId && userId !== "env-admin") {
      const user = await User.findById(userId).select("firstName lastName avatarUpdatedAt").lean() as any;
      if (user) {
        return NextResponse.json({
          role,
          userId,
          name: `${user.firstName} ${user.lastName}`,
          avatarUpdatedAt: user.avatarUpdatedAt ?? null,
        });
      }
    }

    // env-based superadmin — no DB record; read avatar timestamp from Settings
    const avatarSetting = await Setting.findOne({ key: "superadmin_avatar" }).lean() as any;
    return NextResponse.json({
      role,
      userId: "env-admin",
      name: "Super Admin",
      avatarUpdatedAt: avatarSetting?.value?.updatedAt ?? null,
    });
  } catch {
    return NextResponse.json({ role, userId: userId ?? "env-admin", name: "Admin", avatarUpdatedAt: null });
  }
}
