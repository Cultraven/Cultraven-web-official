import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { EmailLog } from "@/lib/models/Setting";
import { isAdminRequest } from "@/lib/admin-auth";
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

    // order stats — dynamically require to avoid circular imports
    let orderCount = 0;
    let orderTotal = 0;
    let recentOrders: any[] = [];
    try {
      const Order = mongoose.models.Order;
      if (Order) {
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
