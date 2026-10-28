/**
 * Where admin-uploaded images and videos live: MongoDB GridFS (bucket "media"), so they survive every deploy.
 * The hosting platform's disk is read-only and wiped on each deploy, so saving files into /public does not work in production.
 * Files are served at /uploads/<random-name>.<ext> by app/uploads/[name]/route.ts.
 */
import { Readable } from "stream";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

export const MEDIA_NAME = /^[a-f0-9]{32}\.(jpg|png|gif|webp|avif|mp4|webm)$/;

export const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", avif: "image/avif", mp4: "video/mp4", webm: "video/webm",
};

async function bucket() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: "media" });
}

export async function saveMedia(name: string, data: Buffer): Promise<void> {
  const b = await bucket();
  await new Promise<void>((resolve, reject) => {
    const up = b.openUploadStream(name, { metadata: { contentType: CONTENT_TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream" } });
    up.on("error", reject);
    up.on("finish", () => resolve());
    up.end(data);
  });
}

export interface MediaInfo { length: number; contentType: string }

export async function mediaInfo(name: string): Promise<MediaInfo | null> {
  if (!MEDIA_NAME.test(name)) return null;
  const b = await bucket();
  const f = (await b.find({ filename: name }).limit(1).toArray())[0] as any;
  if (!f) return null;
  return { length: Number(f.length), contentType: CONTENT_TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream" };
}

/** A web stream of the file, or of the byte range start..end (inclusive). */
export async function openMedia(name: string, range?: { start: number; end: number }): Promise<ReadableStream<Uint8Array>> {
  const b = await bucket();
  const stream = b.openDownloadStreamByName(name, range ? { start: range.start, end: range.end + 1 } : undefined);
  return Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;
}

/** "bytes=0-99" -> {start:0,end:99}; null when absent or not understood. */
export function parseRange(header: string | null, size: number): { start: number; end: number } | null | "bad" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return "bad";
  let start: number, end: number;
  if (m[1] === "") { const n = Number(m[2]); start = Math.max(0, size - n); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return "bad";
  return { start, end };
}
