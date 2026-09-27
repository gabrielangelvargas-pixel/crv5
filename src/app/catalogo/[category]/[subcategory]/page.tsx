import { CatalogPage } from "@/components/catalog/catalog-page";

type CatalogSubcategoryPageProps = {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
};

export default async function Page({ params }: CatalogSubcategoryPageProps) {
  const { category, subcategory } = await params;

  return <CatalogPage categorySlug={category} subcategorySlug={subcategory} />;
}
