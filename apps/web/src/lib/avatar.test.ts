import { describe, it, expect } from "vitest";
import { AVATAR_MAX_BYTES, decodeStoredAvatar, parseAvatarDataUrl, sniffImageMime } from "./avatar";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from("JFIF"), Buffer.alloc(40, 1), Buffer.from([0xff, 0xd9])]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 2)]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x20, 0, 0, 0]), Buffer.from("WEBPVP8 "), Buffer.alloc(30, 3)]);
const GIF = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(30, 4)]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

const url = (mime: string, b: Buffer) => `data:${mime};base64,${b.toString("base64")}`;

describe("sniffImageMime (magic bytes)", () => {
  it("identifies jpeg, png and webp", () => {
    expect(sniffImageMime(JPEG)).toBe("image/jpeg");
    expect(sniffImageMime(PNG)).toBe("image/png");
    expect(sniffImageMime(WEBP)).toBe("image/webp");
  });
  it("rejects gif, svg, html, empty and truncated input", () => {
    expect(sniffImageMime(GIF)).toBeNull();
    expect(sniffImageMime(SVG)).toBeNull();
    expect(sniffImageMime(Buffer.from("<html></html>"))).toBeNull();
    expect(sniffImageMime(Buffer.alloc(0))).toBeNull();
    expect(sniffImageMime(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(sniffImageMime(Buffer.from("RIFF1234WAVE"))).toBeNull(); // RIFF but not WEBP
  });
});

describe("parseAvatarDataUrl", () => {
  it("accepts jpeg / png / webp whose bytes match the declared type", () => {
    for (const [mime, b] of [["image/jpeg", JPEG], ["image/png", PNG], ["image/webp", WEBP]] as const) {
      const r = parseAvatarDataUrl(url(mime, b));
      expect(r.ok).toBe(true);
      if (r.ok) { expect(r.mime).toBe(mime); expect(r.bytes.equals(b)).toBe(true); expect(r.dataUrl).toBe(url(mime, b)); }
    }
  });

  it("rejects svg, gif and other declared types with 415", () => {
    for (const mime of ["image/svg+xml", "image/gif", "text/html", "application/pdf", "image/avif", "image/bmp"]) {
      const r = parseAvatarDataUrl(url(mime, JPEG));
      expect(r).toMatchObject({ ok: false, status: 415 });
    }
  });

  it("rejects an SVG/HTML/GIF payload even when it claims to be image/jpeg (magic bytes)", () => {
    expect(parseAvatarDataUrl(url("image/jpeg", SVG))).toMatchObject({ ok: false, status: 415 });
    expect(parseAvatarDataUrl(url("image/png", GIF))).toMatchObject({ ok: false, status: 415 });
    expect(parseAvatarDataUrl(url("image/webp", Buffer.from("<html>")))).toMatchObject({ ok: false, status: 415 });
  });

  it("rejects a real image declared as a different image type", () => {
    expect(parseAvatarDataUrl(url("image/jpeg", PNG))).toMatchObject({ ok: false, status: 415 });
    expect(parseAvatarDataUrl(url("image/png", WEBP))).toMatchObject({ ok: false, status: 415 });
  });

  it("enforces the 150 KB decoded limit (inclusive) with 413", () => {
    const exact = Buffer.concat([JPEG, Buffer.alloc(AVATAR_MAX_BYTES - JPEG.length, 7)]);
    expect(exact.length).toBe(AVATAR_MAX_BYTES);
    expect(parseAvatarDataUrl(url("image/jpeg", exact)).ok).toBe(true);
    const over = Buffer.concat([exact, Buffer.from([1])]);
    expect(parseAvatarDataUrl(url("image/jpeg", over))).toMatchObject({ ok: false, status: 413 });
    const huge = Buffer.concat([JPEG, Buffer.alloc(2 * 1024 * 1024, 7)]);
    expect(parseAvatarDataUrl(url("image/jpeg", huge))).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects malformed input with 400", () => {
    for (const bad of [undefined, null, 42, {}, "", "hello", "data:image/jpeg;base64,", "data:image/jpeg,AAAA", "data:image/jpeg;base64,@@@@", "data:image/jpeg;base64,AAA", "image/jpeg;base64,AAAA"]) {
      const r = parseAvatarDataUrl(bad as any);
      expect(r.ok).toBe(false);
      if (!r.ok) expect([400, 415]).toContain(r.status);
    }
  });

  it("rejects extra data-URL parameters (charset etc.) and embedded whitespace", () => {
    expect(parseAvatarDataUrl(`data:image/jpeg;charset=utf-8;base64,${JPEG.toString("base64")}`).ok).toBe(false);
    const b64 = JPEG.toString("base64");
    expect(parseAvatarDataUrl(`data:image/jpeg;base64,${b64.slice(0, 8)} ${b64.slice(8)}`).ok).toBe(false);
  });
});

describe("decodeStoredAvatar", () => {
  it("round-trips a stored value and returns null for garbage / empty", () => {
    const stored = url("image/webp", WEBP);
    expect(decodeStoredAvatar(stored)).toMatchObject({ mime: "image/webp" });
    expect(decodeStoredAvatar("")).toBeNull();
    expect(decodeStoredAvatar(undefined)).toBeNull();
    expect(decodeStoredAvatar("not a data url")).toBeNull();
  });
});
