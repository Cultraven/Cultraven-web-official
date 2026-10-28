import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";
import { getPageBanner } from "@/lib/page-banners";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.shipping). */
export async function generateMetadata() {
  return policyMetadata("page.shipping", "/pages/shipping");
}

export default async function ShippingPage() {
  const [data, banner] = await Promise.all([getPolicy("page.shipping"), getPageBanner("shipping")]);
  return <PolicyPage data={data} banner={banner} />;
}
