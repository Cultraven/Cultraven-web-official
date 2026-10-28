import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";
import { getPageBanner } from "@/lib/page-banners";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.terms). */
export async function generateMetadata() {
  return policyMetadata("page.terms", "/pages/terms");
}

export default async function TermsPage() {
  const [data, banner] = await Promise.all([getPolicy("page.terms"), getPageBanner("terms")]);
  return <PolicyPage data={data} banner={banner} />;
}
