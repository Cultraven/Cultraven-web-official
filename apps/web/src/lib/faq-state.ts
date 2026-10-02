/**
 * Open/close rules for one FAQ question (pure, so they can be unit-tested without a browser).
 *
 *   closed ──hover──▶ hover  (preview: closes again when the pointer leaves)
 *   hover  ──click──▶ pinned (stays open after the pointer leaves)
 *   closed ──click──▶ pinned
 *   pinned ──click──▶ closed (and hover is ignored until the pointer leaves, so it really closes under the cursor)
 *
 * Touch screens have no hover: the browser fakes mouseenter right before a tap's click, so the component ignores
 * hover events unless the device can really hover. Click always works everywhere (also via keyboard Enter / Space).
 */
export type FaqMode = "closed" | "hover" | "pinned";
export interface FaqState { mode: FaqMode; blocked: boolean }
export type FaqEvent = "enter" | "leave" | "click";

export const FAQ_INITIAL: FaqState = { mode: "closed", blocked: false };

export function faqReducer(s: FaqState, e: FaqEvent): FaqState {
  switch (e) {
    case "enter":
      return s.mode === "closed" && !s.blocked ? { mode: "hover", blocked: false } : s;
    case "leave":
      return { mode: s.mode === "hover" ? "closed" : s.mode, blocked: false };
    case "click":
      return s.mode === "pinned" ? { mode: "closed", blocked: true } : { mode: "pinned", blocked: false };
  }
}

export const isFaqOpen = (s: FaqState, forceOpen = false) => forceOpen || s.mode !== "closed";

/** Small delays so sweeping the pointer across a list doesn't flash every answer open and shut. */
export const HOVER_OPEN_DELAY_MS = 90;
export const HOVER_CLOSE_DELAY_MS = 140;
