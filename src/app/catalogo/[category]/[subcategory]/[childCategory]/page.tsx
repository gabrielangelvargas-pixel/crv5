import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { getCategoryMetadata } from "@/lib/category-metadata";

type CatalogChildCategoryPageProps = {
  params: Promise<{
    category: string;
    subcategory: string;
    childCategory: string;
  }>;
};

export async function generateMetadata({ params }: CatalogChildCategoryPageProps): Promise<Metadata> {
  const { category, subcategory, childCategory } = await params;
  return getCategoryMetadata([category, subcategory, childCategory]);
}

export default async function Page({ params }: CatalogChildCategoryPageProps) {
  const { category, subcategory, childCategory } = await params;

  return (
    <CatalogPage
      categorySlug={category}
      subcategorySlug={subcategory}
      childCategorySlug={childCategory}
    />
  );
}
