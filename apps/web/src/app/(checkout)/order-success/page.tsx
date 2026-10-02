import React, { Suspense } from "react";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { maskEmail } from "@/lib/mask-email";
import { cookies } from "next/headers";
import { CUSTOMER_COOKIE, verifyCustomerToken } from "@/lib/customer-auth";
import { getSmtpSettings } from "@/lib/mailer";
import OrderSuccessClient, { type OrderSummary } from "./OrderSuccessClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const rawId = resolvedParams.orderId;
  const orderId = (Array.isArray(rawId) ? rawId[0] : rawId)?.slice(0, 64);
  
  let isConfirmed = false;
  let orderData = null;
  let summary: OrderSummary | null = null;
  let emailOn = false;

  if (orderId) {
    try {
      await connectToDatabase();
      let query: any = {};
      
      // Try by DB _id first, then by razorpayOrderId
      if (orderId.startsWith("order_")) {
         query = { razorpayOrderId: orderId };
      } else {
         query = { _id: orderId };
      }

      const order = await Order.findOne(query).lean() as any;
      
      if (order) {
        orderData = {
          email: maskEmail(order.deliveryAddress?.email || ""),
          amountPaise: order.totalPaise || 0,
        };
        // For COD, "pending" is expected. For Razorpay, we expect "paid" after webhook.
        // Wait, if it's razorpay, webhook might take a second. But if they reached success page, razorpay was successful on frontend.
        // The prompt says: "verify the order is paid via API before showing 'confirmed'".
        // This means we strictly check DB. We will pass status to client.
        // Full details only for the customer who placed the order (the id alone must not expose an address).
        const session = verifyCustomerToken((await cookies()).get(CUSTOMER_COOKIE)?.value);
        if (session && order.userId === session.userId) {
          const smtp = await getSmtpSettings();
          emailOn = !!(smtp && smtp.enabled);
          summary = {
            number: `CR-${String(order._id).slice(-6).toUpperCase()}`,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            items: (order.items ?? []).map((i: any) => ({ title: i.title, image: i.image, size: i.size, color: i.color ?? "", quantity: i.quantity, pricePaise: i.pricePaise })),
            subtotalPaise: order.subtotalPaise, discountPaise: order.discountPaise ?? 0, shippingPaise: order.shippingPaise ?? 0, codFeePaise: order.codFeePaise ?? 0, totalPaise: order.totalPaise,
            address: { name: order.deliveryAddress?.name ?? "", line1: order.deliveryAddress?.line1 ?? "", line2: order.deliveryAddress?.line2 ?? "", city: order.deliveryAddress?.city ?? "", state: order.deliveryAddress?.state ?? "", pincode: order.deliveryAddress?.pincode ?? "", phone: order.deliveryAddress?.phone ?? "" },
          };
        }
        isConfirmed = order.paymentMethod === "cod" ? true : order.paymentStatus === "paid";
      }
    } catch (err) {
      console.error("Failed to verify order:", err);
    }
  }

  return (
    <Suspense fallback={
      <div style={{ backgroundColor: "var(--color-cream)", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-gray)", fontSize: "0.85rem" }}>Loading order details…</div>
      </div>
    }>
      <OrderSuccessClient 
        orderId={orderId} 
        paymentId={resolvedParams.paymentId as string | undefined}
        isConfirmed={isConfirmed}
        orderData={orderData}
        summary={summary}
        emailOn={emailOn}
      />
    </Suspense>
  );
}
