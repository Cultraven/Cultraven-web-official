import Link from "next/link";
import { SECTIONS } from "@/lib/cms/registry";
import { Icon, PageHeader } from "@/components/admin/ui";

const EXTRA = [
  { href: "/portal-secure/cms/hero", group: "Homepage", label: "Hero", description: "Main homepage media — image, video or slideshow — with text and buttons.", icon: "film" },
  { href: "/portal-secure/cms/shop-the-look", group: "Homepage", label: "Shop the Look", description: "Model image and the shoppable pieces in the look.", icon: "image" },
  { href: "/portal-secure/products", group: "Shop", label: "Products & galleries", description: "Product details, gallery images and New / Bestseller flags.", icon: "box" },
];

export default function AdminCmsIndexPage() {
  const groups = ["Homepage", "Shop", "Pages", "Site"] as const;
  return (
    <>
      <PageHeader eyebrow="Website" title="Website content" description="Everything here is saved to the database and shown on the live website. Changes appear as soon as you save." />
      {groups.map((g) => {
        const items = [
          ...EXTRA.filter((e) => e.group === g),
          ...SECTIONS.filter((s) => s.group === g).map((s) => ({ href: `/portal-secure/cms/${s.key}`, label: s.label, description: s.description, icon: "layout" })),
        ];
        if (!items.length) return null;
        return (
          <div key={g}>
            <h2 className="adm-section-title">{g}</h2>
            <div className="adm-tiles">
              {items.map((it) => (
                <Link key={it.href} href={it.href} prefetch={false} className="adm-tile">
                  <b style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name={it.icon} size={16} /> {it.label}</b>
                  <span>{it.description}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
