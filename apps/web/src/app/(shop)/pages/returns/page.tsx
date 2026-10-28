import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";
import { getPageBanner } from "@/lib/page-banners";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.returns). */
export async function generateMetadata() {
  return policyMetadata("page.returns", "/pages/returns");
}

export default async function ReturnsPage() {
  const [data, banner] = await Promise.all([getPolicy("page.returns"), getPageBanner("returns")]);
  return <PolicyPage data={data} banner={banner} />;
}
