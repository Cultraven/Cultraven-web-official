import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { avatarUrl } from "@/lib/avatar-url";
import ProfileClient from "@/components/account/ProfileClient";

export const dynamic = "force-dynamic";

/** /account/profile — details, password, photo, logout, delete account. Data comes from MongoDB (never the avatar bytes). */
export default async function ProfilePage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/api/auth/expired"); // soft-deleted / unknown account: clear the cookie, go to login

  let u: any = null;
  let failed = false;
  try {
    await connectToDatabase();
    u = await User.findById(me.userId).select("firstName lastName email phone avatarUpdatedAt").lean();
  } catch (e) {
    failed = true;
    console.error("[account] profile page load failed:", e instanceof Error ? e.message : e);
  }

  if (failed || !u) {
    return (
      <>
        <header className="acct-head">
          <span className="acct-eyebrow">My account</span>
          <h1 className="acct-title">Profile</h1>
        </header>
        <p role="alert" style={{ color: "#b42318", fontWeight: 700 }}>We couldn&apos;t load your profile right now. Please refresh in a moment.</p>
      </>
    );
  }

  const version = u.avatarUpdatedAt ? new Date(u.avatarUpdatedAt).getTime() : null;
  const letter = (u.firstName || u.email || "C").trim().charAt(0).toUpperCase();

  return (
    <ProfileClient
      initial={{
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        email: u.email ?? me.email,
        phone: u.phone ?? "",
        avatar: avatarUrl(version),
        letter,
      }}
    />
  );
}
