import { describe, it, expect } from "vitest";
import { AVATAR_QUALITY, coverCrop, qualitySteps } from "./image-crop";

describe("coverCrop (centre square)", () => {
  it("crops a landscape photo to its centred height-sized square", () => {
    expect(coverCrop(1600, 900)).toEqual({ sx: 350, sy: 0, side: 900 });
  });
  it("crops a portrait photo to its centred width-sized square", () => {
    expect(coverCrop(900, 1600)).toEqual({ sx: 0, sy: 350, side: 900 });
  });
  it("keeps a square as is", () => {
    expect(coverCrop(512, 512)).toEqual({ sx: 0, sy: 0, side: 512 });
  });
  it("never returns a crop outside the image or a zero side", () => {
    for (const [w, h] of [[1, 1], [3, 1001], [1001, 3], [257, 256], [0, 0]]) {
      const c = coverCrop(w, h);
      expect(c.side).toBeGreaterThanOrEqual(1);
      expect(c.sx).toBeGreaterThanOrEqual(0);
      expect(c.sy).toBeGreaterThanOrEqual(0);
      if (w > 0 && h > 0) { expect(c.sx + c.side).toBeLessThanOrEqual(w); expect(c.sy + c.side).toBeLessThanOrEqual(h); }
    }
  });
});

describe("qualitySteps", () => {
  it("starts at the default 0.82 and only goes down", () => {
    const s = qualitySteps();
    expect(s[0]).toBe(AVATAR_QUALITY);
    expect(s[0]).toBeCloseTo(0.82);
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeLessThan(s[i - 1]);
    expect(s[s.length - 1]).toBeGreaterThanOrEqual(0.5);
  });
});
