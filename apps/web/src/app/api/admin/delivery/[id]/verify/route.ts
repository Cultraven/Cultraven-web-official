import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { DeliveryKyc } from "@/lib/models/DeliveryKyc";
import { sendMail } from "@/lib/mailer";
import { deliveryKYCDecisionEmail } from "@/lib/email-templates";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSuperAdminRequest(req)) return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });

  const { id } = await params;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { decision, note } = parsed.data;

  try {
    await connectToDatabase();
    const user = await User.findOne({ _id: id, role: "delivery" }).select("firstName email verificationStatus").lean() as any;
    if (!user) return NextResponse.json({ error: "Delivery user not found" }, { status: 404 });

    await User.findByIdAndUpdate(id, {
      $set: {
        verificationStatus: decision,
        verificationNote: note ?? null,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cultraven.com";
    const loginUrl = `${siteUrl}/portal-delivery-access`;
    const tpl = deliveryKYCDecisionEmail({ firstName: user.firstName, approved: decision === "approved", note, loginUrl, siteUrl });
    sendMail({ to: user.email, ...tpl, kind: "delivery_kyc_decision" }).catch(() => {});

    return NextResponse.json({ ok: true, verificationStatus: decision });
  } catch (err) {
    console.error("[admin/delivery/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}

/** GET — return KYC doc images for admin review (superadmin only). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSuperAdminRequest(req)) return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  const { id } = await params;

  try {
    await connectToDatabase();
    const kyc = await DeliveryKyc.findOne({ userId: id })
      .select("+aadhaarNumber +selfieDataUrl +aadhaarFrontDataUrl +aadhaarBackDataUrl +panDataUrl")
      .lean() as any;

    if (!kyc) return NextResponse.json({ kyc: null });

    return NextResponse.json({
      kyc: {
        phone: kyc.phone,
        address: kyc.address,
        city: kyc.city,
        state: kyc.state,
        pincode: kyc.pincode,
        aadhaarNumber: kyc.aadhaarNumber ? `XXXX-XXXX-${kyc.aadhaarNumber.slice(-4)}` : null,
        panNumber: kyc.panNumber,
        submittedAt: kyc.submittedAt,
        selfieDataUrl: kyc.selfieDataUrl ?? null,
        aadhaarFrontDataUrl: kyc.aadhaarFrontDataUrl ?? null,
        aadhaarBackDataUrl: kyc.aadhaarBackDataUrl ?? null,
        panDataUrl: kyc.panDataUrl ?? null,
      },
    });
  } catch (err) {
    console.error("[admin/delivery/kyc]", err);
    return NextResponse.json({ error: "Server error" }, { status: 503 });
  }
}
