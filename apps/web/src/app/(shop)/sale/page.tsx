import type { Metadata } from "next";
import CategoryClient from "../category/[slug]/CategoryClient";

export const metadata: Metadata = {
  title: "Sale | CULTRAVEN Drops",
  description: "Shop the latest sale items from CULTRAVEN. Gen Z heavyweight streetwear.",
};

export default function SalePage() {
  return <CategoryClient slug="sale" categoryName="Sale" />;
}
