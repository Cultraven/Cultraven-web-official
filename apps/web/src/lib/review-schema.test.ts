import { describe, it, expect } from "vitest";
import { ReviewWriteSchema, cleanText, publicName, averageRating } from "./review-schema";

describe("reviews", () => {
  it("strips tags and control characters", () => {
    expect(cleanText("  <script>alert(1)</script>Great\u0000  tee ")).toBe("alert(1)Great tee");
  });
  it("accepts a valid review and cleans it", () => {
    const r = ReviewWriteSchema.parse({ slug: "x", rating: 5, comment: "Love the <b>fit</b> and fabric" });
    expect(r.comment).toBe("Love the fit and fabric");
    expect(r.title).toBe("");
  });
  it("rejects bad ratings, short or oversized comments, non-string slugs", () => {
    const ok = "long enough text";
    expect(ReviewWriteSchema.safeParse({ slug: "x", rating: 0, comment: ok }).success).toBe(false);
    expect(ReviewWriteSchema.safeParse({ slug: "x", rating: 6, comment: ok }).success).toBe(false);
    expect(ReviewWriteSchema.safeParse({ slug: "x", rating: 4.5, comment: ok }).success).toBe(false);
    expect(ReviewWriteSchema.safeParse({ slug: "x", rating: 4, comment: "short" }).success).toBe(false);
    expect(ReviewWriteSchema.safeParse({ slug: "x", rating: 4, comment: "a".repeat(1001) }).success).toBe(false);
    expect(ReviewWriteSchema.safeParse({ slug: { $ne: null }, rating: 4, comment: ok }).success).toBe(false);
  });
  it("masks names", () => {
    expect(publicName("Aarav", "Sharma")).toBe("Aarav S.");
    expect(publicName("Aarav", "")).toBe("Aarav");
    expect(publicName("", "", "jitesh@x.com")).toBe("J•••");
    expect(publicName()).toBe("Customer");
  });
  it("averages to one decimal", () => {
    expect(averageRating([])).toBe(0);
    expect(averageRating([5, 4, 4])).toBe(4.3);
  });
});
