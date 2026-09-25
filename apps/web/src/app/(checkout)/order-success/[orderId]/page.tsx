import React from "react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

interface OrderSuccessProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({
  params,
}: OrderSuccessProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order #${orderId} | CULTRAVEN`,
    description: `Order confirmation #${orderId} on CULTRAVEN.`,
  };
}

export default async function OrderSuccessPage({ params }: OrderSuccessProps) {
  const { orderId } = await params;
  return (
    <ComingSoon
      page={`Order #${orderId}`}
      description="Live drop order verification will be available here once purchases go live."
      showNotify={false}
    />
  );
}
