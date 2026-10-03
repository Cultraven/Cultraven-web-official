import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, getAdminUserId } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Setting } from "@/lib/models/Setting";
import { parseAvatarDataUrl } from "@/lib/avatar";

export const dynamic = "force-dynamic";

/** GET — serve the current admin's avatar image. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return new NextResponse(null, { status: 401 });
  const userId = getAdminUserId(req);

  try {
    await connectToDatabase();

    if (userId && userId !== "env-admin") {
      const user = await User.findById(userId).select("+avatar").lean() as any;
      if (user?.avatar) {
        const m = /^data:(image\/[a-z+]+);base64,/.exec(user.avatar);
        const mime = m?.[1] ?? "image/jpeg";
        const b64 = user.avatar.split(",")[1];
        return new NextResponse(Buffer.from(b64, "base64"), {
          headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" },
        });
      }
    } else {
      // env superadmin — stored in Settings
      const doc = await Setting.findOne({ key: "superadmin_avatar" }).lean() as any;
      if (doc?.value?.dataUrl) {
        const m = /^data:(image\/[a-z+]+);base64,/.exec(doc.value.dataUrl);
        const mime = m?.[1] ?? "image/jpeg";
        const b64 = doc.value.dataUrl.split(",")[1];
        return new NextResponse(Buffer.from(b64, "base64"), {
          headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" },
        });
      }
    }
  } catch { /* fall through to 404 */ }

  return new NextResponse(null, { status: 404 });
}

/** POST { dataUrl } — upload / replace avatar. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = getAdminUserId(req);

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const check = parseAvatarDataUrl(body?.dataUrl);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    await connectToDatabase();
    const now = new Date();

    if (userId && userId !== "env-admin") {
      await User.findByIdAndUpdate(userId, { $set: { avatar: check.dataUrl, avatarUpdatedAt: now } });
    } else {
      await Setting.findOneAndUpdate(
        { key: "superadmin_avatar" },
        { $set: { value: { dataUrl: check.dataUrl, updatedAt: now } } },
        { upsert: true }
      );
    }

    return NextResponse.json({ ok: true, avatarUpdatedAt: now.toISOString() });
  } catch (err) {
    console.error("[admin/profile/avatar] error:", err);
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 503 });
  }
}

/** DELETE — remove avatar. */
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = getAdminUserId(req);

  try {
    await connectToDatabase();
    if (userId && userId !== "env-admin") {
      await User.findByIdAndUpdate(userId, { $set: { avatar: "", avatarUpdatedAt: null } });
    } else {
      await Setting.deleteOne({ key: "superadmin_avatar" });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 503 });
  }
}
