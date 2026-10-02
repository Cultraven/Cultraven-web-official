import { describe, it, expect } from "vitest";
import { FAQ_INITIAL, faqReducer, isFaqOpen, type FaqEvent, type FaqState } from "./faq-state";

const run = (events: FaqEvent[], from: FaqState = FAQ_INITIAL) => events.reduce(faqReducer, from);

describe("faqReducer (hover to preview, click to pin)", () => {
  it("starts closed", () => {
    expect(FAQ_INITIAL).toEqual({ mode: "closed", blocked: false });
    expect(isFaqOpen(FAQ_INITIAL)).toBe(false);
  });
  it("hover previews and leaving closes it again", () => {
    expect(run(["enter"]).mode).toBe("hover");
    expect(isFaqOpen(run(["enter"]))).toBe(true);
    expect(run(["enter", "leave"]).mode).toBe("closed");
  });
  it("click while hovering pins it: it survives the pointer leaving", () => {
    const s = run(["enter", "click"]);
    expect(s.mode).toBe("pinned");
    expect(run(["enter", "click", "leave"]).mode).toBe("pinned");
  });
  it("click from closed (touch, keyboard) pins it", () => {
    expect(run(["click"]).mode).toBe("pinned");
  });
  it("click on a pinned item closes it, even with the pointer still over it", () => {
    const s = run(["enter", "click", "click"]);
    expect(s.mode).toBe("closed");
    expect(isFaqOpen(s)).toBe(false);
    // ...and a stray re-enter (jitter) does not reopen it until the pointer has left once
    expect(run(["enter", "click", "click", "enter"]).mode).toBe("closed");
    expect(run(["enter", "click", "click", "leave", "enter"]).mode).toBe("hover");
  });
  it("re-entering an already open item changes nothing", () => {
    expect(run(["click", "enter"]).mode).toBe("pinned");
    expect(run(["enter", "enter"]).mode).toBe("hover");
  });
  it("leave never closes a pinned item", () => {
    expect(run(["click", "leave", "leave"]).mode).toBe("pinned");
  });
  it("forceOpen (expand all) overrides the state", () => {
    expect(isFaqOpen(FAQ_INITIAL, true)).toBe(true);
    expect(isFaqOpen(run(["click", "click"]), true)).toBe(true);
  });
  it("is deterministic over long random event streams and never reaches an invalid state", () => {
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const evs: FaqEvent[] = ["enter", "leave", "click"];
    let s = FAQ_INITIAL;
    for (let i = 0; i < 5000; i++) {
      s = faqReducer(s, evs[Math.floor(rnd() * 3)]);
      expect(["closed", "hover", "pinned"]).toContain(s.mode);
      if (s.blocked) expect(s.mode).toBe("closed"); // blocked only ever follows a close
    }
  });
});
