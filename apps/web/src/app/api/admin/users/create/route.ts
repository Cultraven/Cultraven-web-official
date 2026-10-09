import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isSuperAdminRequest } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendMail } from "@/lib/mailer";
import { staffAccountCreatedEmail } from "@/lib/email-templates";
import { MobileField } from "@/lib/address-schema";

export const dynamic = "force-dynamic";

const Schema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName:  z.string().trim().min(1).max(50),
  email:     z.string().trim().email().max(254),
  phone:     MobileField, // mandatory for every account, same rules as customer sign-up
  password:  z.string().min(8).max(128),
  role:      z.enum(["admin", "delivery", "customer"]),
});

export async function POST(req: NextRequest) {
  if (!isSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 422 });
  }

  const { firstName, lastName, email, phone, password, role } = parsed.data;

  try {
    await connectToDatabase();

    const exists = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
    if (exists) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName, lastName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role,
      status: "active",
      emailVerified: true,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";
    const loginUrl = role === "delivery"
      ? `${siteUrl}/portal-delivery-access`
      : `${siteUrl}/portal-access`;

    const tpl = staffAccountCreatedEmail({ firstName, email: email.toLowerCase(), password, role, loginUrl, siteUrl });
    sendMail({ to: email.toLowerCase(), ...tpl, kind: "staff_account_created" }).catch(() => {});

    return NextResponse.json({ ok: true, id: user._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("[admin/users/create] POST failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
