/**
 * Shared HTTP plumbing for the address routes: bounded JSON body reading, generic error responses, zod error summaries,
 * client-IP extraction. Nothing here ever echoes caller-controlled text back, and no error detail from Node/Mongo is exposed.
 */
import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { clientIp, isSameOrigin, plainJsonError } from "@/lib/sanitize";

/** One import point for the address routes: IP extraction (trusts only our proxy hop) and the Origin/Sec-Fetch-Site CSRF check. */
export { clientIp, isSameOrigin };

export const MAX_JSON_BYTES = 8 * 1024;

export const apiError = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>) =>
  NextResponse.json({ error, ...extra }, { status, headers });

export type JsonBody = { ok: true; body: unknown } | { ok: false; res: NextResponse };

/** Reads a JSON request body, refusing anything over `maxBytes` (declared or actual) without buffering it all. */
export async function readJsonBody(req: Request, maxBytes = MAX_JSON_BYTES): Promise<JsonBody> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, res: apiError(413, "Request too large") };
  const reader = req.body?.getReader();
  if (!reader) return { ok: false, res: apiError(400, "Invalid JSON") };
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) { await reader.cancel().catch(() => {}); return { ok: false, res: apiError(413, "Request too large") }; }
      chunks.push(value);
    }
    const buf = new Uint8Array(received);
    let o = 0;
    for (const c of chunks) { buf.set(c, o); o += c.byteLength; }
    const data: unknown = JSON.parse(new TextDecoder().decode(buf));
    // Layer 1: a non-object body, or any key starting with "$" / containing "." / __proto__ / constructor / prototype, never reaches zod.
    if (plainJsonError(data)) return { ok: false, res: apiError(400, "Invalid request") };
    return { ok: true, body: data };
  } catch {
    return { ok: false, res: apiError(400, "Invalid JSON") };
  }
}

/**
 * Turns a ZodError into `{ error, issues }` for a 422 body. `issues` is keyed by the full field path ("state", "address.state").
 * Only our own validator messages and zod's fixed type/size messages are returned — never the offending value or key names.
 */
export function summarizeZodError(err: ZodError): { error: string; issues: Record<string, string[]> } {
  const issues: Record<string, string[]> = {};
  let first = "";
  for (const i of err.issues) {
    const message = i.code === "custom" || i.code === "invalid_type" || i.code === "too_small" || i.code === "too_big"
      ? i.message
      : i.code === "unrecognized_keys" ? "Unexpected field" : "Invalid value";
    const key = i.path.map(String).join(".") || "_";
    (issues[key] ||= []).push(message);
    if (!first) first = message;
  }
  return { error: first || "Validation failed", issues };
}

export const unprocessable = (err: ZodError) => NextResponse.json(summarizeZodError(err), { status: 422 });

/** Mongo ObjectId path/param check: exactly 24 hex chars (stricter than mongoose.isValidObjectId, which also accepts any 12-char string). */
export const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
