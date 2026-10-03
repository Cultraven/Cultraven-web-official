import { NextRequest, NextResponse } from "next/server";
import { isDeliveryRequest, getDeliveryPayload } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { DeliveryKyc } from "@/lib/models/DeliveryKyc";
import { Setting } from "@/lib/models/Setting";
import { sendMail, getSmtpSettings } from "@/lib/mailer";
import { deliveryKYCSubmittedEmail } from "@/lib/email-templates";
import { z } from "zod";

export const dynamic = "force-dynamic";

const KYC_IMG_MAX = 500 * 1024; // 500 KB decoded per image

const KYC_ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function validateImage(val: unknown, field: string): string | null {
  if (!val) return null; // optional images
  if (typeof val !== "string") return `${field}: must be a string`;
  const m = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/]+=*)$/.exec(val.trim());
  if (!m) return `${field}: invalid image format`;
  const mime = m[1];
  if (!KYC_ALLOWED_MIMES.has(mime)) return `${field}: only JPEG, PNG or WebP images are allowed`;
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > KYC_IMG_MAX) return `${field}: image too large (max 500 KB)`;
  // Magic byte check to prevent MIME spoofing
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  const realMime = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : null;
  if (!realMime) return `${field}: file is not a valid image`;
  if (realMime !== mime) return `${field}: image content does not match its declared type`;
  return null;
}

const Schema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN (e.g. ABCDE1234F)"),
  selfieDataUrl: z.string().optional(),
  aadhaarFrontDataUrl: z.string().optional(),
  aadhaarBackDataUrl: z.string().optional(),
  panDataUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!isDeliveryRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = getDeliveryPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 422 });

  const data = parsed.data;

  // Validate image fields
  for (const [field, key] of [
    ["Selfie", "selfieDataUrl"], ["Aadhaar front", "aadhaarFrontDataUrl"],
    ["Aadhaar back", "aadhaarBackDataUrl"], ["PAN card", "panDataUrl"],
  ] as [string, keyof typeof data][]) {
    const err = validateImage(data[key], field);
    if (err) return NextResponse.json({ error: err }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(payload.userId).select("firstName email verificationStatus").lean() as any;
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (user.verificationStatus === "approved") {
      return NextResponse.json({ error: "Your account is already approved. Re-submission is not allowed." }, { status: 409 });
    }

    // Save or update KYC document
    await DeliveryKyc.findOneAndUpdate(
      { userId: payload.userId },
      {
        $set: {
          userId: payload.userId,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          aadhaarNumber: data.aadhaarNumber,
          panNumber: data.panNumber.toUpperCase(),
          selfieDataUrl: data.selfieDataUrl ?? "",
          aadhaarFrontDataUrl: data.aadhaarFrontDataUrl ?? "",
          aadhaarBackDataUrl: data.aadhaarBackDataUrl ?? "",
          panDataUrl: data.panDataUrl ?? "",
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Update user verification status
    await User.findByIdAndUpdate(payload.userId, { $set: { verificationStatus: "pending", verificationNote: null } });

    // Email the superadmin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";
    const adminUrl = `${siteUrl}/portal-secure/delivery-verification`;
    const smtp = await getSmtpSettings();
    const adminEmails = smtp?.adminEmails ?? [];
    const superAdminEmail = process.env.ADMIN_EMAIL;
    const targets = Array.from(new Set([...adminEmails, ...(superAdminEmail ? [superAdminEmail] : [])]));

    for (const to of targets) {
      const tpl = deliveryKYCSubmittedEmail({ partnerName: `${user.firstName}`, partnerEmail: user.email, adminUrl, siteUrl });
      sendMail({ to, ...tpl, kind: "delivery_kyc_submitted" }).catch(() => {});
    }

    return NextResponse.json({ ok: true, verificationStatus: "pending" });
  } catch (err) {
    console.error("[delivery/register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}

/** GET — return the current delivery partner's KYC (without images). */
export async function GET(req: NextRequest) {
  if (!isDeliveryRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = getDeliveryPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const kyc = await DeliveryKyc.findOne({ userId: payload.userId }).select("-selfieDataUrl -aadhaarFrontDataUrl -aadhaarBackDataUrl -panDataUrl").lean() as any;
    return NextResponse.json({ kyc: kyc ? { phone: kyc.phone, address: kyc.address, city: kyc.city, state: kyc.state, pincode: kyc.pincode, panNumber: kyc.panNumber, submittedAt: kyc.submittedAt } : null });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}
