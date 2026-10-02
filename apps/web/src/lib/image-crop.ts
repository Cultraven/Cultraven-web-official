/**
 * Browser-side helpers that turn any picked photo into a small square avatar.
 * `coverCrop` is pure (unit tested); `resizeToSquareJpeg` needs a DOM canvas and only runs in the browser.
 */

export const AVATAR_SIZE = 256;
export const AVATAR_QUALITY = 0.82;
/** Aim for a result below this size; quality steps down until it is met. */
export const AVATAR_TARGET_BYTES = 60 * 1024;
/** Refuse absurdly large inputs before even decoding them. */
export const AVATAR_MAX_INPUT_BYTES = 20 * 1024 * 1024;

/** Centre "cover" crop: the largest centred square of the source, to be drawn scaled onto a `size` x `size` canvas. */
export function coverCrop(srcW: number, srcH: number): { sx: number; sy: number; side: number } {
  const side = Math.max(1, Math.min(srcW, srcH));
  return { sx: Math.max(0, Math.floor((srcW - side) / 2)), sy: Math.max(0, Math.floor((srcH - side) / 2)), side };
}

/** Quality ladder used to get under the target size. */
export function qualitySteps(start = AVATAR_QUALITY): number[] {
  const steps = [start, 0.74, 0.66, 0.58, 0.5];
  return steps.filter((q, i) => i === 0 || q < start);
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("decode")); img.src = url; });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((res) => c.toBlob(res, type, q));
const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("read")); r.readAsDataURL(b); });

export interface ResizedAvatar { blob: Blob; dataUrl: string; bytes: number; width: number; height: number }

/** Decode `file`, centre-crop to a square, scale to 256x256 and encode as JPEG (<= ~60 KB where possible). */
export async function resizeToSquareJpeg(file: File): Promise<ResizedAvatar> {
  if (file.size > AVATAR_MAX_INPUT_BYTES) throw new Error("That picture is too large. Pick one under 20 MB.");
  let dec;
  try { dec = await decode(file); } catch { throw new Error("We couldn't read that picture. Please use a JPG, PNG or WebP image."); }
  try {
    const { sx, sy, side } = coverCrop(dec.width, dec.height);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser can't resize pictures.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff"; // JPEG has no alpha: transparent PNGs get a clean white backdrop
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    ctx.drawImage(dec.source, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    let blob: Blob | null = null;
    for (const q of qualitySteps()) {
      blob = await toBlob(canvas, "image/jpeg", q);
      if (blob && blob.size <= AVATAR_TARGET_BYTES) break;
    }
    if (!blob) throw new Error("Your browser couldn't encode the picture.");
    return { blob, dataUrl: await blobToDataUrl(blob), bytes: blob.size, width: AVATAR_SIZE, height: AVATAR_SIZE };
  } finally {
    dec.release();
  }
}
