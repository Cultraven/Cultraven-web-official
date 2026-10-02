import { NextResponse } from "next/server";

/**
 * Legacy endpoint, intentionally disabled. It accepted client-supplied prices, which would let anyone
 * create orders at arbitrary amounts. Orders are created server-priced via /api/razorpay/create-order.
 */
export async function POST() {
  return NextResponse.json({ error: "Gone. Use the checkout page." }, { status: 410 });
}
