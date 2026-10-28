import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";
import { getPageBanner } from "@/lib/page-banners";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.privacy). */
export async function generateMetadata() {
  return policyMetadata("page.privacy", "/pages/privacy");
}

export default async function PrivacyPage() {
  const [data, banner] = await Promise.all([getPolicy("page.privacy"), getPageBanner("privacy")]);
  return <PolicyPage data={data} banner={banner} />;
}
