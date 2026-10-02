import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaqAccordion } from "./FaqAccordion";
import { HOVER_CLOSE_DELAY_MS, HOVER_OPEN_DELAY_MS } from "@/lib/faq-state";

const items = [
  { q: "How do I track my order?", a: "Open Account → Orders." },
  { q: "Can I cancel my order?", a: "Yes, within 7 days." },
];

/** Pretend the device can (or cannot) hover. */
function setHover(can: boolean) {
  window.matchMedia = ((query: string) => ({ matches: can && /hover: hover/.test(query), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as any;
}
const row = (n: number) => screen.getAllByRole("button")[n].closest(".faq-item") as HTMLElement;
const btn = (n: number) => screen.getAllByRole("button")[n];
const open = (n: number) => row(n).getAttribute("data-open") === "true";
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("FaqAccordion on a device with a mouse", () => {
  beforeEach(() => setHover(true));

  it("renders every question closed with correct ARIA", () => {
    render(<FaqAccordion items={items} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(open(0)).toBe(false);
    expect(btn(0).getAttribute("aria-expanded")).toBe("false");
    const panelId = btn(0).getAttribute("aria-controls")!;
    expect(document.getElementById(panelId)?.getAttribute("role")).toBe("region");
  });

  it("opens on hover (after a short intent delay) and closes when the mouse leaves", () => {
    render(<FaqAccordion items={items} />);
    fireEvent.mouseEnter(row(0));
    expect(open(0)).toBe(false); // not instantly — sweeping past shouldn't flash answers
    tick(HOVER_OPEN_DELAY_MS + 5);
    expect(open(0)).toBe(true);
    expect(btn(0).getAttribute("aria-expanded")).toBe("true");
    fireEvent.mouseLeave(row(0));
    expect(open(0)).toBe(true); // still open during the close delay
    tick(HOVER_CLOSE_DELAY_MS + 5);
    expect(open(0)).toBe(false);
  });

  it("a quick sweep across the question never opens it", () => {
    render(<FaqAccordion items={items} />);
    fireEvent.mouseEnter(row(0));
    tick(HOVER_OPEN_DELAY_MS - 30);
    fireEvent.mouseLeave(row(0));
    tick(500);
    expect(open(0)).toBe(false);
  });

  it("click pins it open: it stays open after the mouse leaves; a second click closes it", () => {
    render(<FaqAccordion items={items} />);
    fireEvent.mouseEnter(row(0)); tick(HOVER_OPEN_DELAY_MS + 5);
    fireEvent.click(btn(0));
    expect(row(0).getAttribute("data-mode")).toBe("pinned");
    fireEvent.mouseLeave(row(0)); tick(HOVER_CLOSE_DELAY_MS + 5);
    expect(open(0)).toBe(true);
    fireEvent.click(btn(0));
    expect(open(0)).toBe(false);
    fireEvent.mouseEnter(row(0)); tick(HOVER_OPEN_DELAY_MS + 5);
    expect(open(0)).toBe(false); // closed under the cursor and stays closed until the mouse leaves
    fireEvent.mouseLeave(row(0)); tick(HOVER_CLOSE_DELAY_MS + 5);
    fireEvent.mouseEnter(row(0)); tick(HOVER_OPEN_DELAY_MS + 5);
    expect(open(0)).toBe(true);
  });

  it("questions are independent of each other", () => {
    render(<FaqAccordion items={items} />);
    fireEvent.click(btn(0));
    fireEvent.mouseEnter(row(1)); tick(HOVER_OPEN_DELAY_MS + 5);
    expect(open(0)).toBe(true);
    expect(open(1)).toBe(true);
    fireEvent.mouseLeave(row(1)); tick(HOVER_CLOSE_DELAY_MS + 5);
    expect(open(0)).toBe(true);
    expect(open(1)).toBe(false);
  });

  it("hover={false} (click-only variant) ignores the mouse but click still works", () => {
    render(<FaqAccordion items={items} hover={false} />);
    fireEvent.mouseEnter(row(0)); tick(500);
    expect(open(0)).toBe(false);
    fireEvent.click(btn(0));
    expect(open(0)).toBe(true);
    fireEvent.mouseLeave(row(0)); tick(500);
    expect(open(0)).toBe(true);
  });

  it("forceOpen (expand all) opens everything", () => {
    render(<FaqAccordion items={items} forceOpen />);
    expect(open(0)).toBe(true);
    expect(open(1)).toBe(true);
  });

  it("shows the topic label above the question when asked", () => {
    render(<FaqAccordion from items={[{ ...items[0], topic: { slug: "t", title: "Orders & delivery", blurb: "", icon: "box", faqs: [] } }]} />);
    expect(screen.getByText("Orders & delivery")).toBeTruthy();
  });
});

describe("FaqAccordion on a touch device (no hover)", () => {
  beforeEach(() => setHover(false));

  it("ignores the fake mouseenter a tap produces: a tap opens it exactly once and it stays open", () => {
    render(<FaqAccordion items={items} />);
    // a phone fires mouseenter, then click, for a single tap
    fireEvent.mouseEnter(row(0));
    tick(HOVER_OPEN_DELAY_MS + 5);
    expect(open(0)).toBe(false);
    fireEvent.click(btn(0));
    expect(open(0)).toBe(true);
    fireEvent.mouseLeave(row(0)); // phones don't send this, but if they do it must not close a pinned item
    tick(HOVER_CLOSE_DELAY_MS + 5);
    expect(open(0)).toBe(true);
  });

  it("a second tap closes it", () => {
    render(<FaqAccordion items={items} />);
    fireEvent.click(btn(0));
    fireEvent.click(btn(0));
    expect(open(0)).toBe(false);
  });

  it("keyboard: Enter / Space on the question toggles it (native button behaviour)", () => {
    render(<FaqAccordion items={items} />);
    btn(0).focus();
    fireEvent.click(btn(0)); // a browser turns Enter/Space on a <button> into a click
    expect(btn(0).getAttribute("aria-expanded")).toBe("true");
  });
});
