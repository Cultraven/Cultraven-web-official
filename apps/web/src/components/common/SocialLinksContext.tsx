"use client";
/**
 * Gives client components (chat window, contact page) the social links saved in Admin -> Social links.
 * The root layout reads them once on the server and provides them here.
 */
import React, { createContext, useContext } from "react";
import { DEFAULT_SOCIAL, socialHref, type SocialLink } from "@/lib/cms/social";

const Ctx = createContext<SocialLink[]>(DEFAULT_SOCIAL);

export function SocialLinksProvider({ links, children }: { links: SocialLink[]; children: React.ReactNode }) {
  return <Ctx.Provider value={links}>{children}</Ctx.Provider>;
}

export const useSocialLinks = () => useContext(Ctx);

/** The Instagram page, or "" when the owner removed it (callers then hide their Instagram link). */
export const useInstagramUrl = () => socialHref(useContext(Ctx), "instagram");
