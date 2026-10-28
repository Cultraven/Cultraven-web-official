import { describe, it, expect } from "vitest";
import { friendlyUploadError, precheckFile, fitWithin, HOST_LIMIT_BYTES } from "./upload-client";

const MB = 1024 * 1024;

describe("upload messages an admin can understand", () => {
  it("explains each failure in plain words, never 'Failed to upload file'", () => {
    for (const s of [0, 401, 403, 413, 415, 429, 500, 502, 503]) {
      const m = friendlyUploadError(s, "Failed to upload file");
      expect(m.length).toBeGreaterThan(25);
      expect(m).not.toMatch(/Failed to upload file/);
    }
    expect(friendlyUploadError(401)).toMatch(/sign in again/i);
    expect(friendlyUploadError(413)).toMatch(/smaller/i);
    expect(friendlyUploadError(415)).toMatch(/JPG/);
    expect(friendlyUploadError(418, "I am a teapot")).toBe("I am a teapot");
  });
});

describe("checking a file before it is sent", () => {
  it("accepts normal photos and flags big ones to be shrunk", () => {
    expect(precheckFile({ type: "image/jpeg", size: 1 * MB }, "image")).toEqual({ ok: true, shrink: false });
    expect(precheckFile({ type: "image/jpeg", size: 8 * MB }, "image")).toEqual({ ok: true, shrink: true });
    expect(precheckFile({ type: "image/png", size: HOST_LIMIT_BYTES + 1 }, "image")).toEqual({ ok: true, shrink: true });
  });
  it("refuses wrong types, enormous photos and big GIFs, with a reason", () => {
    for (const bad of [{ type: "application/pdf", size: 100 }, { type: "image/svg+xml", size: 100 }, { type: "", size: 100 }]) {
      const r: any = precheckFile(bad, "image");
      expect(r.ok).toBe(false);
      expect(r.message).toMatch(/JPG/);
    }
    expect((precheckFile({ type: "image/jpeg", size: 40 * MB }, "image") as any).ok).toBe(false);
    expect((precheckFile({ type: "image/gif", size: 6 * MB }, "image") as any).message).toMatch(/GIF/);
  });
  it("videos: only MP4/WebM, and only small ones can go through the server (the rest need a link)", () => {
    expect(precheckFile({ type: "video/mp4", size: 3 * MB }, "video")).toEqual({ ok: true, shrink: false });
    expect((precheckFile({ type: "video/mp4", size: 20 * MB }, "video") as any).message).toMatch(/paste/i);
    expect((precheckFile({ type: "video/quicktime", size: 1 * MB }, "video") as any).ok).toBe(false);
  });
});

describe("shrinking a photo", () => {
  it("keeps the shape and never makes it bigger", () => {
    expect(fitWithin(4000, 3000, 2400)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(3000, 4000, 2400)).toEqual({ width: 1800, height: 2400 });
    expect(fitWithin(800, 600, 2400)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(10000, 1, 2400)).toEqual({ width: 2400, height: 1 });
  });
});
