import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { DeliveryKyc } from "@/lib/models/DeliveryKyc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();

    const users = await User.find({ role: "delivery" })
      .select("firstName lastName email phone verificationStatus verificationNote createdAt avatarUpdatedAt")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean() as any[];

    const kycs = await DeliveryKyc.find({ userId: { $in: users.map((u: any) => u._id) } })
      .select("userId phone address city state pincode panNumber submittedAt")
      .lean() as any[];

    const kycMap = Object.fromEntries(kycs.map((k: any) => [k.userId.toString(), k]));

    const list = users.map((u: any) => ({
      id: u._id.toString(),
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone ?? null,
      verificationStatus: u.verificationStatus ?? "unverified",
      verificationNote: u.verificationNote ?? null,
      avatarUpdatedAt: u.avatarUpdatedAt ?? null,
      createdAt: u.createdAt,
      kyc: kycMap[u._id.toString()] ? {
        phone: kycMap[u._id.toString()].phone,
        address: kycMap[u._id.toString()].address,
        city: kycMap[u._id.toString()].city,
        state: kycMap[u._id.toString()].state,
        pincode: kycMap[u._id.toString()].pincode,
        panNumber: kycMap[u._id.toString()].panNumber,
        submittedAt: kycMap[u._id.toString()].submittedAt,
      } : null,
    }));

    return NextResponse.json({ partners: list });
  } catch (err) {
    console.error("[admin/delivery/pending]", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}
