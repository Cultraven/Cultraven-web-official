/**
 * Browser-side helpers for admin uploads: clear error messages, and shrinking big photos so they fit the hosting
 * platform's 4.5 MB request limit (phone photos are often 5-12 MB).
 */
export const HOST_LIMIT_BYTES = 4 * 1024 * 1024; // what the hosting platform accepts in one request, with a safety margin
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 40;

/** A short, plain explanation for a failed upload (never the raw technical message). */
export function friendlyUploadError(status: number, serverMessage?: string): string {
  switch (status) {
    case 0: return "No connection. Check your internet and try again.";
    case 401: return "Your admin sign-in has expired. Sign in again, then upload the file again.";
    case 403: return "This browser tab can't upload right now. Reload the page and try again.";
    case 413: return "That file is too big for the server. Use a smaller photo (under 4 MB), or paste an image link instead.";
    case 415: return "That file type isn't supported. Use a JPG, PNG, WebP, AVIF or GIF photo.";
    case 429: return "Too many uploads in a short time. Wait a minute and try again.";
    default:
      if (status >= 500) return "The file could not be saved on the server. Please try again in a moment. If it keeps failing, paste an image link instead.";
      return serverMessage || "The upload did not work. Please try again.";
  }
}

export type PreCheck = { ok: true; shrink: boolean } | { ok: false; message: string };

/** Quick checks on the chosen file before anything is sent. */
export function precheckFile(file: { type: string; size: number; name?: string }, kind: "image" | "video"): PreCheck {
  if (kind === "video") {
    if (!/^video\/(mp4|webm)$/.test(file.type)) return { ok: false, message: "Choose an MP4 or WebM video." };
    if (file.size > HOST_LIMIT_BYTES) return { ok: false, message: `Videos can only be uploaded here up to 4 MB (hosting limit). For a bigger video, upload it to YouTube, Cloudinary or similar and paste its direct .mp4 link in the box instead.` };
    return { ok: true, shrink: false };
  }
  if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(file.type)) return { ok: false, message: "Choose a JPG, PNG, WebP, AVIF or GIF photo." };
  if (file.size > MAX_IMAGE_MB * 1024 * 1024 * 3) return { ok: false, message: `That photo is very large (over ${MAX_IMAGE_MB * 3} MB). Pick a smaller one.` };
  if (file.size > HOST_LIMIT_BYTES) {
    if (file.type === "image/gif") return { ok: false, message: "That GIF is over 4 MB. Use a smaller GIF, or a JPG/PNG/WebP photo." };
    return { ok: true, shrink: true };
  }
  return { ok: true, shrink: false };
}

/** The size to shrink a photo to: its longest side at most `max` pixels, keeping the shape. */
export function fitWithin(width: number, height: number, max = 2400): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

/** Shrinks a photo in the browser until it is under the hosting limit. Falls back to the original if the browser can't do it. */
export async function shrinkImage(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    let max = 2400;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { width, height } = fitWithin(bmp.width, bmp.height, max);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bmp, 0, 0, width, height);
      const type = file.type === "image/png" && attempt === 0 ? "image/webp" : "image/jpeg";
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, type, 0.85 - attempt * 0.1));
      if (blob && blob.size <= HOST_LIMIT_BYTES) {
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
      }
      max = Math.round(max * 0.75);
    }
  } catch { /* fall through */ }
  return file;
}
