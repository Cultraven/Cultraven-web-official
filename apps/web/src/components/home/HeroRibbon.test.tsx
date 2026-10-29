import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { HeroRibbon } from "./HeroRibbon";
import { SECTIONS, validateFields } from "@/lib/cms/registry";

afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });

const items = [{ id: "1", text: "NEW DROP", active: true }, { id: "2", text: "COMING SOON", active: true }];

describe("hero ribbon", () => {
  it("shows the messages, scrolling, with the real words available to screen readers once", () => {
    const { container } = render(<HeroRibbon content={{ enabled: true, items }} />);
    const region = screen.getByRole("region", { name: "Highlights" });
    expect(region).toBeTruthy();
    expect(Array.from(container.querySelectorAll(".hr-sr li")).map((l) => l.textContent)).toEqual(["NEW DROP", "COMING SOON"]);
    expect(container.querySelector(".hr-track")?.getAttribute("aria-hidden")).toBe("true");
    // two identical halves so the loop has no gap
    const spans = container.querySelectorAll(".hr-track .hr-item");
    expect(spans.length % 2).toBe(0);
    expect(spans.length).toBeGreaterThanOrEqual(20);
  });

  it("the on/off switch: off, missing, or with nothing to say, it renders nothing", () => {
    expect(render(<HeroRibbon content={{ enabled: false, items }} />).container.innerHTML).toBe("");
    cleanup();
    expect(render(<HeroRibbon content={null} />).container.innerHTML).toBe("");
    cleanup();
    expect(render(<HeroRibbon content={{ enabled: true, items: [] }} />).container.innerHTML).toBe("");
    cleanup();
    expect(render(<HeroRibbon content={{ enabled: true, items: [{ text: "  ", active: true }, { text: "HIDDEN", active: false }] }} />).container.innerHTML).toBe("");
  });

  it("a record saved before the switch existed (no 'enabled') stays on", () => {
    const { container } = render(<HeroRibbon content={{ items }} />);
    expect(container.querySelector(".hr-ribbon")).not.toBeNull();
  });

  it("hidden messages are left out and the rest keep the admin's order", () => {
    const { container } = render(<HeroRibbon content={{ enabled: true, items: [{ text: "ONE", active: true }, { text: "TWO", active: false }, { text: "THREE", active: true }] }} />);
    expect(Array.from(container.querySelectorAll(".hr-sr li")).map((l) => l.textContent)).toEqual(["ONE", "THREE"]);
  });

  it("colour and speed come from the admin, with safe limits", () => {
    let { container } = render(<HeroRibbon content={{ enabled: true, tone: "Gold", seconds: 25, items }} />);
    expect(container.querySelector(".hr-ribbon")?.className).toContain("hr-gold");
    expect((container.querySelector(".hr-track") as HTMLElement).style.animationDuration).toBe("25s");
    cleanup();
    ({ container } = render(<HeroRibbon content={{ enabled: true, tone: "purple", seconds: 9999, items }} />));
    expect(container.querySelector(".hr-ribbon")?.className).toContain("hr-navy");
    expect((container.querySelector(".hr-track") as HTMLElement).style.animationDuration).toBe("120s");
    cleanup();
    ({ container } = render(<HeroRibbon content={{ enabled: true, seconds: 1, items }} />));
    expect((container.querySelector(".hr-track") as HTMLElement).style.animationDuration).toBe("10s");
  });

  it("markup in a message is shown as plain text, never run", () => {
    const { container } = render(<HeroRibbon content={{ enabled: true, items: [{ text: "<img src=x onerror=alert(1)>", active: true }] }} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});

describe("close (✕) button", () => {
  const closeBtn = () => screen.queryByRole("button", { name: /close this ribbon/i });

  it("is there by default, like the top announcement bar's ✕, and the owner can switch it off", () => {
    render(<HeroRibbon content={{ enabled: true, items }} />);
    expect(closeBtn()).not.toBeNull();
    cleanup();
    const { container } = render(<HeroRibbon content={{ enabled: true, dismissible: false, items }} />);
    expect(closeBtn()).toBeNull();
    expect(container.querySelector(".hr-ribbon")).not.toBeNull(); // the ribbon itself stays
  });

  it("closing it removes the ribbon, and it stays closed for the rest of the visit", () => {
    const { container, unmount } = render(<HeroRibbon content={{ enabled: true, items }} />);
    fireEvent.click(closeBtn()!);
    expect(container.innerHTML).toBe("");
    unmount();
    const again = render(<HeroRibbon content={{ enabled: true, items }} />); // e.g. coming back to the home page
    expect(again.container.innerHTML).toBe("");
  });

  it("new messages bring it back for people who closed the old one", () => {
    const first = render(<HeroRibbon content={{ enabled: true, items }} />);
    fireEvent.click(closeBtn()!);
    first.unmount();
    const changed = render(<HeroRibbon content={{ enabled: true, items: [{ text: "SALE IS LIVE", active: true }] }} />);
    expect(changed.container.querySelector(".hr-ribbon")).not.toBeNull();
  });

  it("works even when the browser blocks storage (private mode): it closes now and may show again next visit", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { container } = render(<HeroRibbon content={{ enabled: true, items }} />);
    expect(container.querySelector(".hr-ribbon")).not.toBeNull();
    fireEvent.click(closeBtn()!);
    expect(container.innerHTML).toBe("");
  });

  it("the button is a real, labelled button that does not submit anything", () => {
    render(<HeroRibbon content={{ enabled: true, items }} />);
    expect(closeBtn()!.getAttribute("type")).toBe("button");
  });
});

describe("hero ribbon in the admin", () => {
  const sec = SECTIONS.find((s) => s.key === "home.heroRibbon")!;
  it("is its own section under Homepage with an on/off switch, colour, speed and a messages list", () => {
    expect(sec.group).toBe("Homepage");
    expect(sec.label).toBe("Hero ribbon");
    const byKey = Object.fromEntries(sec.fields.map((f: any) => [f.key, f]));
    expect(byKey.enabled).toMatchObject({ kind: "boolean", switch: true });
    expect(byKey.tone.options).toEqual(["Navy", "Gold"]);
    expect(byKey.dismissible).toMatchObject({ kind: "boolean", switch: true, default: true }); // the ✕ close button switch
    expect(byKey.seconds).toMatchObject({ kind: "number", min: 10, max: 120 });
    expect(byKey.items.fields.map((f: any) => f.key)).toEqual(["text", "active"]);
  });
  it("saves a normal ribbon, and refuses an empty message or one that is too long", () => {
    expect(validateFields(sec.fields, { enabled: true, tone: "Gold", seconds: 30, dismissible: false, items: [{ text: "NEW DROP", active: true }] }).errors).toEqual([]);
    expect(validateFields(sec.fields, { enabled: false, tone: "Navy", seconds: 40, items: [] }).errors).toEqual([]);
    expect(validateFields(sec.fields, { enabled: true, items: [{ text: "", active: true }] }).errors.length).toBeGreaterThan(0);
    expect(validateFields(sec.fields, { enabled: true, items: [{ text: "x".repeat(41), active: true }] }).errors.length).toBeGreaterThan(0);
  });
  it("the home page shows it right under the hero, and the seed creates it", () => {
    const web = path.resolve(__dirname, "../../..");
    const page = fs.readFileSync(path.join(web, "src/app/(shop)/page.tsx"), "utf8");
    expect(page).toContain('getCmsSection<any>("home.heroRibbon")');
    expect(page.indexOf("<HeroBanner")).toBeLessThan(page.indexOf("<HeroRibbon"));
    expect(page.indexOf("<HeroRibbon")).toBeLessThan(page.indexOf("<NewDropSection"));
    expect(fs.readFileSync(path.join(web, "scripts/seed-cms.mjs"), "utf8")).toContain('"home.heroRibbon"');
  });
});
