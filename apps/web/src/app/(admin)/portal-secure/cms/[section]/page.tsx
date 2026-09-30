import { notFound } from "next/navigation";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { SECTION_MAP } from "@/lib/cms/registry";

export default async function AdminCmsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const key = decodeURIComponent(section);
  if (!SECTION_MAP[key]) notFound();
  return <SectionEditor sectionKey={key} />;
}
