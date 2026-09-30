/** Shop shell — see components/home/SiteChrome.tsx. Rendered per request so it never bakes DB state into the build. */
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/home/SiteChrome";

export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
