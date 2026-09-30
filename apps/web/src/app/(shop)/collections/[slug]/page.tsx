import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";

interface Props { params: Promise<{ slug: string }> }

const COLLECTION_META: Record<string, { name: string; description: string; image: string }> = {
  "new-in": { name: "New In", description: "The freshest pieces from CULTRAVEN — new drops, updated silhouettes and limited editions.", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1400&auto=format&fit=crop&q=85" },
  "street": { name: "Street", description: "A collection built for movement, individuality and everyday rebellion.", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&auto=format&fit=crop&q=85" },
  "bestsellers": { name: "Bestsellers", description: "The ones everyone keeps coming back for — our most loved styles.", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1400&auto=format&fit=crop&q=85" },
  "essentials": { name: "Essentials", description: "Clean, heavyweight basics built to outlast every trend.", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1400&auto=format&fit=crop&q=85" },
  "all": { name: "All Products", description: "Every piece from CULTRAVEN — filter, sort and discover.", image: "https://images.unsplash.com/photo-1529391409740-59f2cea08bc6?w=1400&auto=format&fit=crop&q=85" },
};

function getMeta(slug: string) {
  return COLLECTION_META[slug] ?? {
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: `Shop the ${slug} collection from CULTRAVEN.`,
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1400&auto=format&fit=crop&q=85",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { name, description } = getMeta(slug);
  return {
    title: name,
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title: name, description, type: "website", images: [image] },
  };
}

export function generateStaticParams() {
  return Object.keys(COLLECTION_META).map((slug) => ({ slug }));
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const { name, description, image } = getMeta(slug);
  return <CollectionClient collectionName={name} collectionSlug={slug} description={description} heroImage={image} />;
}
