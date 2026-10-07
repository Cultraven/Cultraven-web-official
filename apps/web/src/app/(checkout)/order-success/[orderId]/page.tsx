import type { Metadata } from "next";
import OrderSuccessClient from "./OrderSuccessClient";

interface OrderSuccessProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: OrderSuccessProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order Confirmed`,
    description: `Your order #${orderId.slice(-6).toUpperCase()} has been placed successfully. Thank you for shopping at CULTRAVEN.`,
  };
}

export default async function OrderSuccessPage({ params }: OrderSuccessProps) {
  const { orderId } = await params;
  return <OrderSuccessClient orderId={orderId} />;
}
