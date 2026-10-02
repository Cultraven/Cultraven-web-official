import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { avatarUrl } from "@/lib/avatar-url";
import { AccountNav } from "@/components/account/AccountNav";
import { SiteChrome } from "@/components/home/SiteChrome";
import "@/components/account/avatar.css";

export const dynamic = "force-dynamic";

/** Shared chrome for every /account page: profile card + navigation. Identity comes from MongoDB via the signed session. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentCustomer();
  // Signed cookie but the account was deleted (e.g. on another device): clear it and go to login (avoids a /login <-> /account loop).
  if (!me) redirect("/api/auth/expired");

  const name = [me.firstName, me.lastName].filter(Boolean).join(" ") || "Your account";
  const initial = (me.firstName || me.email || "C").trim().charAt(0).toUpperCase();
  const photo = avatarUrl(me.avatarVersion);

  return (
    <SiteChrome>
    <div className="acct">
      <div className="acct-grid">
        <aside className="acct-side" aria-label="Account">
          <Link href="/account/profile" className="acct-profile" aria-label={`${name} — edit your profile`}>
            <div className="acct-avatar" aria-hidden="true">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" width={58} height={58} />
              ) : (
                initial
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <b>{name}</b>
              <span>{me.email}</span>
              <span className="acct-profile-edit">Edit profile</span>
            </div>
          </Link>
          <AccountNav />
        </aside>
        <section aria-live="polite">{children}</section>
      </div>
    </div>
    </SiteChrome>
  );
}
