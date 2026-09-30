import type { ReactNode } from "react";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { AccountNav } from "@/components/account/AccountNav";
import { SiteChrome } from "@/components/home/SiteChrome";

export const dynamic = "force-dynamic";

/** Shared chrome for every /account page: profile card + navigation. Identity comes from MongoDB via the signed session. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentCustomer();
  const name = [me?.firstName, me?.lastName].filter(Boolean).join(" ") || "Your account";
  const initial = (me?.firstName || me?.email || "C").trim().charAt(0).toUpperCase();

  return (
    <SiteChrome>
    <div className="acct">
      <div className="acct-grid">
        <aside className="acct-side" aria-label="Account">
          <div className="acct-profile">
            <div className="acct-avatar" aria-hidden="true">{initial}</div>
            <div style={{ minWidth: 0 }}>
              <b>{name}</b>
              <span>{me?.email ?? ""}</span>
            </div>
          </div>
          <AccountNav />
        </aside>
        <section aria-live="polite">{children}</section>
      </div>
    </div>
    </SiteChrome>
  );
}
