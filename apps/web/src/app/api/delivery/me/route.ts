import { NextRequest, NextResponse } from "next/server";
import { isDeliveryRequest, getDeliveryPayload } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDeliveryRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = getDeliveryPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const user = await User.findById(payload.userId)
      .select("firstName lastName email phone verificationStatus verificationNote avatarUpdatedAt status")
      .lean() as any;

    if (!user || user.status === "deleted") return NextResponse.json({ error: "Account not found" }, { status: 404 });

    return NextResponse.json({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone ?? null,
      verificationStatus: user.verificationStatus ?? "unverified",
      verificationNote: user.verificationNote ?? null,
      avatarUpdatedAt: user.avatarUpdatedAt ?? null,
    });
  } catch (err) {
    console.error("[delivery/me]", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}
