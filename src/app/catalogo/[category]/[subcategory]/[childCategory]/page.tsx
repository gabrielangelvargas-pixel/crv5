import { CatalogPage } from "@/components/catalog/catalog-page";

type CatalogChildCategoryPageProps = {
  params: Promise<{
    category: string;
    subcategory: string;
    childCategory: string;
  }>;
};

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
