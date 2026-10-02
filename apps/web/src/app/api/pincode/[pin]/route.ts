import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const cache = new Map<string, { city: string; state: string }>();

/** GET /api/pincode/411001 — city + state for an Indian pincode (India Post data). Best-effort: {} when unknown/unavailable. */
export async function GET(_req: Request, ctx: { params: Promise<{ pin: string }> }) {
  const { pin } = await ctx.params;
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  const hit = cache.get(pin);
  if (hit) return NextResponse.json(hit);
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    const j = (await r.json()) as any[];
    const po = j?.[0]?.PostOffice?.[0];
    if (j?.[0]?.Status === "Success" && po?.District && po?.State) {
      const v = { city: String(po.District), state: String(po.State) };
      cache.set(pin, v);
      return NextResponse.json(v);
    }
  } catch { /* fall through: the shopper just types it */ }
  return NextResponse.json({});
}
