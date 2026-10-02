import { NextResponse } from "next/server";
import { getRazorpayConfigAsync } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * Which payment methods can be offered right now. Reveals nothing but yes/no.
 * "online" is true only when Razorpay keys exist (Admin -> Settings -> Payments, else .env) AND the admin
 * "Enable online payments" switch is on.
 */
export async function GET() {
  const online = !!(await getRazorpayConfigAsync());
  return NextResponse.json({ online, cod: true }, { headers: { "Cache-Control": "no-store" } });
}
