import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { EmailLog } from "@/lib/models/Setting";
import { isAdminRequest, isSuperAdminRequest, getAdminUserId } from "@/lib/admin-auth";
import { Address } from "@/lib/models/Address";
import { Order } from "@/lib/models/Order";
import { DeliveryKyc } from "@/lib/models/DeliveryKyc";
import { buildSoftDeleteUpdate } from "@/lib/account-delete";
import { isSameOrigin, parseJsonBody } from "@/lib/sanitize";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await connectToDatabase();

    const user = await User.findById(id)
      .select("firstName lastName email phone role status emailVerified avatarUpdatedAt createdAt updatedAt deletedAt")
      .lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const u = user as any;

    // order stats
    let orderCount = 0;
    let orderTotal = 0;
    let recentOrders: any[] = [];
    try {
      {
        const [orders, count, allOrders] = await Promise.all([
          Order.find({ userId: id })
            .select("_id items totalPaise subtotalPaise discountPaise shippingPaise fulfillmentStatus paymentStatus paymentMethod deliveryAddress couponCode createdAt")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean() as Promise<any[]>,
          Order.countDocuments({ userId: id }),
          Order.find({ userId: id }).select("totalPaise").lean() as Promise<any[]>,
        ]);
        orderCount = count;
        orderTotal = allOrders.reduce((s: number, o: any) => s + (o.totalPaise ?? 0), 0);
        recentOrders = orders.map((o: any) => ({
          id: o._id.toString(),
          orderNumber: `CR-${o._id.toString().slice(-6).toUpperCase()}`,
          items: (o.items ?? []).map((item: any) => ({
            title: item.title,
            size: item.size,
            color: item.color ?? "",
            quantity: item.quantity,
            pricePaise: item.pricePaise,
          })),
          totalPaise: o.totalPaise,
          subtotalPaise: o.subtotalPaise,
          discountPaise: o.discountPaise ?? 0,
          shippingPaise: o.shippingPaise ?? 0,
          fulfillmentStatus: o.fulfillmentStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          couponCode: o.couponCode ?? "",
          deliveryCity: o.deliveryAddress?.city ?? "",
          deliveryState: o.deliveryAddress?.state ?? "",
          createdAt: o.createdAt,
        }));
      }
    } catch { /* orders not critical */ }

    // email audit log — keyed by email address
    const emailLogs = await EmailLog.find({ to: u.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean() as any[];

    return NextResponse.json({
      user: {
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone ?? null,
        role: u.role ?? "customer",
        status: (u.status as string) || "active",
        emailVerified: u.emailVerified ?? false,
        avatarUpdatedAt: u.avatarUpdatedAt ?? null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        deletedAt: u.deletedAt ?? null,
      },
      stats: {
        orderCount,
        orderTotalPaise: orderTotal,
      },
      recentOrders,
      emailLogs: emailLogs.map((l: any) => ({
        id: l._id.toString(),
        kind: l.kind,
        subject: l.subject,
        status: l.status,
        error: l.error ?? "",
        orderId: l.orderId ?? "",
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error("[admin/users/:id] GET failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}

/**
 * DELETE — permanently delete an account (Admin -> Users -> Delete account).
 *  - removes the person's KYC documents (Aadhaar/PAN images) and saved addresses;
 *  - an account with NO orders is removed completely; one WITH orders is anonymised instead (email freed, name kept off the
 *    sign-in, avatar removed) because those orders are accounting records;
 *  - admins can delete customers and delivery partners; only the superadmin can delete admins; superadmin accounts and your own
 *    account can never be deleted here.
 * Body must be {"confirm":"DELETE"} so a stray request cannot remove anyone.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await parseJsonBody(req, 512);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
  if ((body.data as { confirm?: unknown })?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Confirmation missing: send {"confirm":"DELETE"}' }, { status: 422 });
  }

  try {
    await connectToDatabase();
    const target = (await User.findById(id).select("role email").lean()) as any;
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.role === "superadmin") return NextResponse.json({ error: "Superadmin accounts can't be deleted here" }, { status: 403 });
    if (target.role === "admin" && !isSuperAdminRequest(req)) {
      return NextResponse.json({ error: "Superadmin access required to delete admin accounts" }, { status: 403 });
    }
    if (getAdminUserId(req) === id) return NextResponse.json({ error: "You can't delete your own account" }, { status: 409 });

    const orderCount = await Order.countDocuments({ userId: id });
    await Promise.all([DeliveryKyc.deleteMany({ userId: id }), Address.deleteMany({ userId: id })]);

    if (orderCount > 0) {
      await User.updateOne({ _id: id, deletedAt: null }, buildSoftDeleteUpdate({ _id: target._id, email: target.email }));
      console.info(`[admin/users] anonymised ${target.role} account ${id} (${orderCount} orders kept)`);
      return NextResponse.json({ ok: true, mode: "anonymised", orders: orderCount });
    }
    await User.deleteOne({ _id: id });
    console.info(`[admin/users] deleted ${target.role} account ${id}`);
    return NextResponse.json({ ok: true, mode: "removed", orders: 0 });
  } catch (err) {
    console.error("[admin/users/:id] DELETE failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
