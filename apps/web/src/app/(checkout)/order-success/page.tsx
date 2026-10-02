import React, { Suspense } from "react";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { maskEmail } from "@/lib/mask-email";
import OrderSuccessClient from "./OrderSuccessClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const rawId = resolvedParams.orderId;
  const orderId = (Array.isArray(rawId) ? rawId[0] : rawId)?.slice(0, 64);
  
  let isConfirmed = false;
  let orderData = null;

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
      />
    </Suspense>
  );
}
