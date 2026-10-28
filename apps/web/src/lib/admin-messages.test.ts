import { describe, it, expect } from "vitest";
import { friendlySaveError } from "./admin-messages";

describe("admin save messages", () => {
  it("say what happened and what to do, and promise that edits are kept when they are", () => {
    expect(friendlySaveError(401)).toMatch(/sign-in has expired/);
    expect(friendlySaveError(500)).toMatch(/still here/);
    expect(friendlySaveError(503)).toMatch(/nothing was saved/);
    expect(friendlySaveError(429)).toMatch(/Wait a minute/);
    expect(friendlySaveError(400, "There is no product at /products/x.")).toBe("There is no product at /products/x.");
    expect(friendlySaveError(418)).toMatch(/error 418/);
  });
});
