"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccountSession, notifyAccountChanged } from "./useAccountSession";
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

/** Signed-in user block at the top of the mobile drawer. */
export function MenuUserBlock({ onClose }: { onClose: () => void }) {
  const s = useAccountSession();
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => { setImgFailed(false); }, [s.avatar]);
  if (!s.loaded || !s.signedIn) return null;
  return (
    <Link
      href="/account/profile"
      onClick={onClose}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.9rem 1.5rem",
        borderBottom: "1px solid var(--color-line)",
        textDecoration: "none",
        background: "var(--color-cream)",
      }}
    >
      <span
        className="hdr-avatar"
        data-has-photo={s.avatar && !imgFailed ? "true" : "false"}
        style={{ width: "38px", height: "38px", fontSize: "14px", flexShrink: 0 }}
      >
        {s.avatar && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.avatar} alt="" width={38} height={38} onError={() => setImgFailed(true)} />
        ) : (
          s.initial
        )}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.82rem", color: "var(--color-navy)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.name || "My Account"}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--color-smoke)", margin: 0, letterSpacing: "0.04em" }}>
          View profile →
        </p>
      </div>
    </Link>
  );
}

/** Logout button for the mobile drawer footer — only renders when signed in. */
export function MenuLogoutButton({ onClose }: { onClose: () => void }) {
  const s = useAccountSession();
  const router = useRouter();
  if (!s.loaded || !s.signedIn) return null;

  const handleLogout = async () => {
    onClose();
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    notifyAccountChanged();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mm-foot-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
        background: "none",
        border: "none",
        borderTop: "1px solid var(--color-line)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontWeight: 800,
        fontSize: "13px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#b42318",
        textAlign: "left",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
      Log Out
    </button>
  );
}
