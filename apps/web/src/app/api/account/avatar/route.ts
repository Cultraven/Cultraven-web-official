/**
 * Profile photo, stored as a data URL on the User document (field `avatar`, never selected by default).
 *
 * GET    /api/account/avatar[?v=<version>] — the signed-in customer's own photo as image bytes (404 when none; ETag + 304).
 * POST   /api/account/avatar               — body: { "avatar": "data:image/jpeg;base64,..." } (or the bare data URL as text).
 *                                            jpeg / png / webp ONLY, decoded size <= 150 KB, magic bytes verified.
 * DELETE /api/account/avatar               — removes the photo.
 */
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { activeCustomerFromRequest } from "@/lib/customer-auth";
import { AVATAR_MAX_BODY_CHARS, decodeStoredAvatar, parseAvatarDataUrl } from "@/lib/avatar";
import { avatarUrl } from "@/lib/avatar-url";
import { json, readLimitedText, unauthorized } from "@/lib/account-api";
import { isSameOrigin, parseJsonBody, rateLimit, retryHeaders } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const UPLOADS_PER_WINDOW = 20;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();

    const meta = (await User.findById(me.userId).select("avatarUpdatedAt").lean()) as any;
    if (!meta?.avatarUpdatedAt) return json({ error: "No profile photo" }, 404);

    const etag = `"av-${new Date(meta.avatarUpdatedAt).getTime()}"`;
    const base = { ETag: etag, "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff", Vary: "Cookie" };
    if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: base });

    const doc = (await User.findById(me.userId).select("+avatar").lean()) as any;
    const img = decodeStoredAvatar(doc?.avatar);
    if (!img) return json({ error: "No profile photo" }, 404);

    return new NextResponse(new Uint8Array(img.bytes), {
      status: 200,
      headers: { ...base, "Content-Type": img.mime, "Content-Length": String(img.bytes.length), "Content-Security-Policy": "default-src 'none'; sandbox" },
    });
  } catch (e) {
    console.error("[account/avatar GET]", e instanceof Error ? e.message : e);
    return json({ error: "Could not load the photo." }, 500);
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();
    const rl = rateLimit(`acct-avatar:${me.userId}`, UPLOADS_PER_WINDOW, UPLOAD_WINDOW_MS);
    if (!rl.ok) return json({ error: "Too many uploads. Please wait a few minutes." }, 429, retryHeaders(rl));

    // Bounded reads: a huge body is rejected without being buffered.
    let candidate: unknown;
    if ((req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
      const body = await parseJsonBody(req, AVATAR_MAX_BODY_CHARS + 1024);
      if (!body.ok) return json({ error: body.status === 413 ? "That picture is too large (max 150 KB after resizing)." : body.error }, body.status);
      candidate = body.data.avatar ?? body.data.image ?? body.data.dataUrl;
    } else {
      // Also accept the bare data URL as the request body (text/plain).
      const body = await readLimitedText(req, AVATAR_MAX_BODY_CHARS);
      if (!body.ok) return json({ error: "That picture is too large (max 150 KB after resizing)." }, 413);
      candidate = body.text;
    }

    const check = parseAvatarDataUrl(candidate);
    if (!check.ok) return json({ error: check.error }, check.status);

    const now = new Date();
    const r = await User.updateOne({ _id: me.userId, deletedAt: null }, { $set: { avatar: check.dataUrl, avatarUpdatedAt: now } });
    if (!r.matchedCount) return unauthorized();
    const version = now.getTime();
    return json({ ok: true, avatar: avatarUrl(version), avatarVersion: version, bytes: check.bytes.length, type: check.mime });
  } catch (e) {
    console.error("[account/avatar POST]", e instanceof Error ? e.message : e);
    return json({ error: "Could not save the photo. Please try again." }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden" }, 403);
  try {
    const me = await activeCustomerFromRequest(req);
    if (!me) return unauthorized();
    await User.updateOne({ _id: me.userId, deletedAt: null }, { $set: { avatar: "", avatarUpdatedAt: null } });
    return json({ ok: true, avatar: null, avatarVersion: null });
  } catch (e) {
    console.error("[account/avatar DELETE]", e instanceof Error ? e.message : e);
    return json({ error: "Could not remove the photo. Please try again." }, 500);
  }
}
