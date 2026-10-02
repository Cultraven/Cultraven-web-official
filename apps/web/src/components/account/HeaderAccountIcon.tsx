"use client";
import React from "react";
import Link from "next/link";
import { useAccountSession } from "./useAccountSession";
import "./avatar.css";

/**
 * Header account area (always the LAST thing in the header's right-hand cluster).
 *  - Visitors see LOGIN and REGISTER buttons.
 *  - Signed-in customers see their photo in a small circle (or their initial) linking to /account/profile.
 * Until the session answers we reserve the visitor-sized slot (an empty placeholder) so the header doesn't jump.
 */
export function HeaderAccountIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const s = useAccountSession();
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => { setImgFailed(false); }, [s.avatar]);

  if (!s.loaded) {
    return <span className="hide-mobile hdr-auth hdr-auth-ph" aria-hidden="true" />;
  }

  if (!s.signedIn) {
    return (
      <div className="hide-mobile hdr-auth" role="group" aria-label="Account">
        <Link href="/login" className="hdr-auth-btn hdr-auth-login" data-testid="hdr-login">Login</Link>
        <Link href="/register" className="hdr-auth-btn hdr-auth-register" data-testid="hdr-register">Register</Link>
      </div>
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
      <span className="hdr-label" aria-hidden="true">Profile</span>
    </Link>
  );
}

/** Login / Register for the top of the phone side menu (visitors only). */
export function MenuAuthButtons({ onClose }: { onClose: () => void }) {
  const s = useAccountSession();
  if (!s.loaded || s.signedIn) return null;
  return (
    <div className="mm-auth" role="group" aria-label="Account">
      <Link href="/login" onClick={onClose} className="hdr-auth-btn hdr-auth-login" data-testid="mm-login">Login</Link>
      <Link href="/register" onClick={onClose} className="hdr-auth-btn hdr-auth-register" data-testid="mm-register">Register</Link>
    </div>
  );
}
