import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const status = searchParams.get("status") ?? "all"; // all | active | deleted
  const role = searchParams.get("role") ?? "all";     // all | customer | admin
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  try {
    await connectToDatabase();

    const filter: Record<string, any> = {};
    if (status !== "all") filter.status = status;
    if (role !== "all") filter.role = role;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("firstName lastName email phone role status emailVerified createdAt updatedAt deletedAt avatarUpdatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // summary counts (ignore search for totals)
    const [totalAll, totalActive, totalDeleted, totalAdmins] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "deleted" }),
      User.countDocuments({ role: "admin" }),
    ]);

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone ?? null,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        avatarUpdatedAt: u.avatarUpdatedAt ?? null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        deletedAt: u.deletedAt ?? null,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: { total: totalAll, active: totalActive, deleted: totalDeleted, admins: totalAdmins },
    });
  } catch (err) {
    console.error("[admin/users] GET failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
