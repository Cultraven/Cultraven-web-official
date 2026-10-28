import { PolicyPage } from "@/components/legal/PolicyPage";
import { getPolicy, policyMetadata } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

/** Every word of this page is edited in Admin → Website content (page.returns). */
export async function generateMetadata() {
  return policyMetadata("page.returns", "/pages/returns");
}

export default async function ReturnsPage() {
  return <PolicyPage data={await getPolicy("page.returns")} />;
}
