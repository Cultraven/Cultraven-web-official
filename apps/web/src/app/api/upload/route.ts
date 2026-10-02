import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { isAdminRequest } from "@/lib/admin-auth";
import { clientIp, isSameOrigin, rateLimit, retryHeaders } from "@/lib/sanitize";

export const runtime = "nodejs";

/**
 * POST /api/upload (admin only, multipart "file").
 *  - the real type comes from magic bytes; the client filename and MIME type are never used
 *  - the stored name is 128 random bits + an extension WE choose (no traversal, no overwrite, no guessing)
 *  - SVG / HTML / anything not in the allow-list is rejected (415), so nothing scriptable is ever served from /uploads
 *  - size caps are enforced before and after reading the body
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
/** multipart framing overhead allowed on top of the largest file */
const MULTIPART_SLACK = 512 * 1024;

type Sniffed = { ext: string; kind: "image" | "video" };

/** ISO base-media brands that are really video. Others under "ftyp" (heic, mif1, ...) are not accepted. */
const MP4_BRANDS = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "msnv", "M4V ", "mmp4"]);

/** Detects the real file type from magic bytes. The filename and client MIME are never trusted. */
function sniff(b: Buffer): Sniffed | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", kind: "image" };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", kind: "image" };
  const head6 = b.subarray(0, 6).toString("ascii");
  if (head6 === "GIF87a" || head6 === "GIF89a") return { ext: "gif", kind: "image" };
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return { ext: "webp", kind: "image" };
  if (b.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = b.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") return { ext: "avif", kind: "image" };
    if (MP4_BRANDS.has(brand)) return { ext: "mp4", kind: "video" };
    return null;
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { ext: "webm", kind: "video" };
  return null;
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rl = rateLimit(`upload:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again in a minute." }, { status: 429, headers: retryHeaders(rl) });
  }

  // Refuse an oversized request before buffering any of it.
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_VIDEO_BYTES + MULTIPART_SLACK) {
    return NextResponse.json({ error: "File too large (max 40MB video / 10MB image)" }, { status: 413 });
  }
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "No file provided" }, { status: 415 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "File too large (max 40MB video / 10MB image)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = sniff(buffer);
    if (!detected) {
      return NextResponse.json({ error: "Unsupported file. Use JPG, PNG, WebP, AVIF, GIF, MP4 or WebM." }, { status: 415 });
    }
    if (detected.kind === "image" && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 413 });
    }

    // Name and extension are ours alone: nothing from the request reaches the path.
    const filename = `${crypto.randomBytes(16).toString("hex")}.${detected.ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer, { flag: "wx" });

    return NextResponse.json({ success: true, url: `/uploads/${filename}`, kind: detected.kind });
  } catch (error) {
    console.error("Upload error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
