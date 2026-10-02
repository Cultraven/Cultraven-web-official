import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { customerFromRequest } from "@/lib/customer-auth";
import { isUserActive } from "@/lib/account-delete";

export const dynamic = "force-dynamic";

/** GET /api/account/me — name + email of the signed-in customer (used to prefill checkout). A soft-deleted account is signed out (401). */
export async function GET(req: NextRequest) {
  const me = customerFromRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const u = (await User.findById(me.userId).select("firstName lastName email deletedAt status").lean()) as any;
    if (u && !isUserActive(u)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ me: { email: u?.email ?? me.email, firstName: u?.firstName ?? "", lastName: u?.lastName ?? "" } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ me: { email: me.email, firstName: "", lastName: "" } });
  }
}
