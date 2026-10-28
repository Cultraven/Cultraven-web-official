import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { inspectToken } from "@/lib/password-reset";
import ResetPasswordForm from "./ResetPasswordForm";

// The link carries a secret token: keep it out of search engines, caches and the Referer header of any link clicked from here.
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const shell = { backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" } as const;
const card = { maxWidth: "420px", width: "100%", backgroundColor: "white", padding: "clamp(1.75rem,5vw,3.5rem)", border: "2px solid var(--color-navy)", boxShadow: "6px 6px 0px 0px var(--color-navy)" } as const;
const heading = { fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 400, color: "var(--color-navy)", textTransform: "uppercase", lineHeight: 1.1, marginBottom: "0.5rem" } as const;
const sub = { fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-gray)" } as const;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const info = token ? await inspectToken(token).catch(() => null) : null;

  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: "1.5rem" }}>
            <Image src="/brand/logo-mark" alt="CULTRAVEN" width={46} height={46} style={{ objectFit: "contain", height: "46px", width: "auto" }} />
          </Link>
          <h1 style={heading}>
            {info ? (info.purpose === "invite" ? <>SET YOUR<br />PASSWORD.</> : <>NEW<br />PASSWORD.</>) : <>LINK<br />EXPIRED.</>}
          </h1>
          <p style={sub}>{info ? "Choose a strong password you don't use anywhere else." : "This link can't be used any more."}</p>
        </div>

        {info ? (
          <ResetPasswordForm token={token} invite={info.purpose === "invite"} />
        ) : (
          <div style={{ textAlign: "center", padding: "1.5rem", backgroundColor: "rgba(23,37,84,0.04)", border: "2px solid var(--color-navy)" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-gray)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
              Reset links work for 30 minutes and only once. Request a new one and we&apos;ll email it right away.
            </p>
            <Link href="/forgot-password" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "48px", padding: "0 2rem", backgroundColor: "var(--color-navy)", color: "var(--color-cream)", fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", boxShadow: "3px 3px 0px var(--color-lava)" }}>
              GET A NEW LINK
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
