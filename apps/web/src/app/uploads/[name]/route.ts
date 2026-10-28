/**
 * GET /uploads/<name>: serves an admin-uploaded image or video from the database (see lib/media-store.ts).
 * Old files that still exist in /public/uploads are served by the platform before this route is reached.
 * Supports byte ranges, which phones need to play and seek videos.
 */
import { NextRequest, NextResponse } from "next/server";
import { MEDIA_NAME, mediaInfo, openMedia, parseRange } from "@/lib/media-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" };

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!MEDIA_NAME.test(name)) return new NextResponse("Not found", { status: 404 });
  try {
    const info = await mediaInfo(name);
    if (!info) return new NextResponse("Not found", { status: 404 });
    const range = parseRange(req.headers.get("range"), info.length);
    if (range === "bad") return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${info.length}` } });
    if (range) {
      const body = await openMedia(name, range);
      return new NextResponse(body, { status: 206, headers: { ...HEADERS, "Content-Type": info.contentType, "Accept-Ranges": "bytes", "Content-Range": `bytes ${range.start}-${range.end}/${info.length}`, "Content-Length": String(range.end - range.start + 1) } });
    }
    const body = await openMedia(name);
    return new NextResponse(body, { headers: { ...HEADERS, "Content-Type": info.contentType, "Accept-Ranges": "bytes", "Content-Length": String(info.length) } });
  } catch (e) {
    console.error("[uploads] read failed:", e instanceof Error ? e.message : e);
    return new NextResponse("Unavailable", { status: 503 });
  }
}
