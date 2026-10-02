"use client";
import React from "react";
import Link from "next/link";
import { useAccountSession } from "./useAccountSession";
import "./avatar.css";

/**
 * Header account button. Visitors see the person icon (-> /account, which sends them to login);
 * signed-in customers see their photo in a small circle (or their initial) linking to /account/profile.
 */
export function HeaderAccountIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const s = useAccountSession();
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => { setImgFailed(false); }, [s.avatar]);

  if (!s.signedIn) {
    return (
      <Link href="/account" aria-label="Account" title="Account" style={style} className={className}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    );
  }

  return (
    <Link href="/account/profile" aria-label="My profile" title="My profile" style={style} className={className} data-signed-in="true">
      <span className="hdr-avatar" data-has-photo={s.avatar && !imgFailed ? "true" : "false"}>
        {s.avatar && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.avatar} alt="" width={30} height={30} onError={() => setImgFailed(true)} />
        ) : (
          s.initial
        )}
      </span>
    </Link>
  );
}
