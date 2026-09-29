import React from "react";
import OrderDetailsClient from "@/components/admin/OrderDetailsClient";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailsClient id={id} />;
}
