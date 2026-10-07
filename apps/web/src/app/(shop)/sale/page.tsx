import type { Metadata } from "next";
import CategoryClient from "../category/[slug]/CategoryClient";

export const metadata: Metadata = {
  title: "Sale",
  description: "Shop discounted t-shirts, hoodies and cargo pants at CULTRAVEN. Free delivery above ₹1,999 and Cash on Delivery available.",
};

export default function SalePage() {
  return <CategoryClient slug="sale" categoryName="Sale" />;
}
