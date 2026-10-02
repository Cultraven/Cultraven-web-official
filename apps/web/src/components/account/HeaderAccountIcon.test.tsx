import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let session = { loaded: true, signedIn: false, initial: "", name: "", avatar: null as string | null };
vi.mock("./useAccountSession", () => ({ useAccountSession: () => session }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a> }));

import { HeaderAccountIcon, MenuAuthButtons } from "./HeaderAccountIcon";

afterEach(() => cleanup());

describe("HeaderAccountIcon", () => {
  it("visitors get Login and Register buttons pointing at the right pages", () => {
    session = { loaded: true, signedIn: false, initial: "", name: "", avatar: null };
    render(<HeaderAccountIcon className="hide-mobile hdr-icon action-icon" />);
    expect(screen.getByTestId("hdr-login").getAttribute("href")).toBe("/login");
    expect(screen.getByTestId("hdr-register").getAttribute("href")).toBe("/register");
    expect(screen.queryByLabelText("My profile")).toBeNull();
  });

  it("signed-in customers get the profile link (initial when there is no photo), not the buttons", () => {
    session = { loaded: true, signedIn: true, initial: "J", name: "Jitesh", avatar: null };
    render(<HeaderAccountIcon className="hide-mobile hdr-icon action-icon" />);
    const link = screen.getByLabelText("My profile");
    expect(link.getAttribute("href")).toBe("/account/profile");
    expect(link.textContent).toContain("J");
    expect(link.textContent).toContain("Profile");
    expect(screen.queryByTestId("hdr-login")).toBeNull();
    expect(screen.queryByTestId("hdr-register")).toBeNull();
  });

  it("shows the photo when there is one", () => {
    session = { loaded: true, signedIn: true, initial: "J", name: "Jitesh", avatar: "/uploads/me.jpg" };
    const { container } = render(<HeaderAccountIcon />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/uploads/me.jpg");
  });

  it("before the session answers nothing clickable shows (no flash of Login for a signed-in customer)", () => {
    session = { loaded: false, signedIn: false, initial: "", name: "", avatar: null };
    const { container } = render(<HeaderAccountIcon />);
    expect(container.querySelectorAll("a").length).toBe(0);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("MenuAuthButtons (phone side menu)", () => {
  it("visitors see Login + Register and tapping one closes the menu", () => {
    session = { loaded: true, signedIn: false, initial: "", name: "", avatar: null };
    const onClose = vi.fn();
    render(<MenuAuthButtons onClose={onClose} />);
    screen.getByTestId("mm-login").click();
    screen.getByTestId("mm-register").click();
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("mm-register").getAttribute("href")).toBe("/register");
  });

  it("renders nothing for signed-in customers or while loading", () => {
    session = { loaded: true, signedIn: true, initial: "J", name: "J", avatar: null };
    const a = render(<MenuAuthButtons onClose={() => {}} />);
    expect(a.container.innerHTML).toBe("");
    a.unmount();
    session = { loaded: false, signedIn: false, initial: "", name: "", avatar: null };
    const b = render(<MenuAuthButtons onClose={() => {}} />);
    expect(b.container.innerHTML).toBe("");
  });
});
