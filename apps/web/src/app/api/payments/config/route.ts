import { NextResponse } from "next/server";
import { getRazorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/** Which payment methods can be offered right now. Reveals nothing but yes/no. */
export async function GET() {
  return NextResponse.json({ online: !!getRazorpayConfig(), cod: true }, { headers: { "Cache-Control": "no-store" } });
}
