"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { BackButton } from "./BackButton";

/** A slim bar with the Back button, shown on every page except the ones listed in `hideOn` (homepage by default). */
export function PageBackBar({ hideOn = ["/"], fallbackHref = "/" }: { hideOn?: string[]; fallbackHref?: string }) {
  const pathname = usePathname() ?? "/";
  if (hideOn.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")))) return null;
  return (
    <div className="page-back">
      <BackButton fallbackHref={fallbackHref} />
    </div>
  );
}
