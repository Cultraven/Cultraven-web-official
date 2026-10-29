import { describe, expect, it } from "vitest";
import { DEFAULT_SOCIAL, profileName, resolveSocialLinks, socialHref } from "./social";

const ok = (items: any[]) => ({ state: "ok", data: { items } });

describe("resolveSocialLinks", () => {
  it("uses the admin's Social links list, in order, and hides entries switched off", () => {
    const links = resolveSocialLinks(
      ok([
        { id: "a", platform: "instagram", href: "https://www.instagram.com/cultraven._/", active: true },
        { id: "b", platform: "facebook", href: "https://www.facebook.com/x", active: false },
        { id: "c", platform: "twitter", href: "https://x.com/cultraven_" },
      ]),
      { state: "ok", data: { socialLinks: [{ platform: "reddit", href: "https://reddit.com/u/old" }] } }
    );
    expect(links.map((l) => l.platform)).toEqual(["instagram", "twitter"]);
  });

  it("an emptied list means no social icons at all (nothing is invented)", () => {
    expect(resolveSocialLinks(ok([]), { state: "ok", data: { socialLinks: [{ platform: "reddit", href: "https://reddit.com/u/old" }] } })).toEqual([]);
  });

  it("before the Social links section is saved, the list that used to live in the Footer is still used", () => {
    const links = resolveSocialLinks({ state: "empty", data: null }, { state: "ok", data: { socialLinks: [{ platform: "instagram", href: "https://www.instagram.com/cultraven._/" }] } });
    expect(links).toEqual([{ id: undefined, platform: "instagram", href: "https://www.instagram.com/cultraven._/" }]);
  });

  it("only https addresses become links, and a platform is listed once", () => {
    const links = resolveSocialLinks(
      ok([
        { platform: "instagram", href: "javascript:alert(1)" },
        { platform: "instagram", href: "http://www.instagram.com/x/" },
        { platform: "instagram", href: "https://www.instagram.com/first/" },
        { platform: "instagram", href: "https://www.instagram.com/second/" },
        { platform: "facebook", href: "" },
        { platform: 5, href: "https://x.com/a" },
      ]),
      null
    );
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe("https://www.instagram.com/first/");
  });

  it("when the database cannot be read, the site chrome shows nothing but pages meant for Google/chat fall back to the brand's own pages", () => {
    const down = { state: "error", data: null };
    expect(resolveSocialLinks(down, down)).toEqual([]);
    expect(resolveSocialLinks(down, down, { fallbackToDefaults: true })).toEqual(DEFAULT_SOCIAL);
    expect(socialHref(DEFAULT_SOCIAL, "instagram")).toBe("https://www.instagram.com/cultraven._/");
  });
});

describe("profileName / socialHref", () => {
  it("reads the profile name from an address", () => {
    expect(profileName("https://www.instagram.com/cultraven._/")).toBe("cultraven._");
    expect(profileName("not a url")).toBe("");
  });
  it("returns an empty string when a platform is not in the list", () => {
    expect(socialHref([{ platform: "reddit", href: "https://reddit.com/u/a" }], "instagram")).toBe("");
  });
});
