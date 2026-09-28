import type { Metadata } from "next";
import { findCategoryBySlugs } from "@/data/categories";
import { getCategoryTree } from "@/lib/categories-repository";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function getCategoryMetadata(slugs: string[]): Promise<Metadata> {
  const categories = await getCategoryTree();
  const category = findCategoryBySlugs(categories, slugs);

  if (!category) {
    return {};
  }

  const title = `${category.name} | CRV4 Mayorista`;
  const description =
    category.description ?? `Productos mayoristas de ${category.name}.`;
  const image = category.imageSrc
    ? [{ url: category.imageSrc, alt: category.name }]
    : undefined;
  const url = `/catalogo/${slugs.join("/")}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      ...(image ? { images: image } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: image.map(({ url: imageUrl }) => imageUrl) } : {}),
    },
  };
}
