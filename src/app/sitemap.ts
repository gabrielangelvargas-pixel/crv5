import type { MetadataRoute } from "next";
import { getCategoryTree } from "@/lib/categories-repository";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getCategoryEntries(
  categories: Awaited<ReturnType<typeof getCategoryTree>>,
  parentPath: string[] = [],
): MetadataRoute.Sitemap {
  return categories.flatMap((category) => {
    const path = [...parentPath, category.slug].join("/");
    const entry: MetadataRoute.Sitemap[number] = {
      url: new URL(`/catalogo/${path}`, siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    };

    return [entry, ...getCategoryEntries(category.subcategories, [...parentPath, category.slug])];
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategoryTree();

  return [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...getCategoryEntries(categories),
  ];
}
