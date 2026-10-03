import { NextRequest, NextResponse } from "next/server";
import { isDeliveryRequest, getDeliveryPayload } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { parseAvatarDataUrl } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDeliveryRequest(req)) return new NextResponse(null, { status: 401 });
  const payload = getDeliveryPayload(req);
  if (!payload) return new NextResponse(null, { status: 401 });

  try {
    await connectToDatabase();
    const user = await User.findById(payload.userId).select("+avatar").lean() as any;
    if (!user?.avatar) return new NextResponse(null, { status: 404 });

    const m = /^data:(image\/[a-z+]+);base64,/.exec(user.avatar);
    const mime = m?.[1] ?? "image/jpeg";
    const b64 = user.avatar.split(",")[1];
    return new NextResponse(Buffer.from(b64, "base64"), {
      headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" },
    });
  } catch { return new NextResponse(null, { status: 404 }); }
}

export async function POST(req: NextRequest) {
  if (!isDeliveryRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = getDeliveryPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const check = parseAvatarDataUrl(body?.dataUrl);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    await connectToDatabase();
    const now = new Date();
    await User.findByIdAndUpdate(payload.userId, { $set: { avatar: check.dataUrl, avatarUpdatedAt: now } });
    return NextResponse.json({ ok: true, avatarUpdatedAt: now.toISOString() });
  } catch {
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 503 });
  }
}
