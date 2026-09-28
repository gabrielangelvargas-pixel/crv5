export type CategoryIconKey =
  | "bag"
  | "gem"
  | "heart"
  | "paintbrush"
  | "pen"
  | "star"
  | "tablet"
  | "default";

export type CategoryNode = {
  id: string;
  parentId: string | null;
  order: number;
  name: string;
  slug: string;
  description: string | null;
  imageSrc: string | null;
  coverImageSrc: string | null;
  iconKey: CategoryIconKey;
  subcategories: CategoryNode[];
};

export function findCategoryBySlugs(
  categories: CategoryNode[],
  slugs: string[],
) {
  let currentCategories = categories;
  let selectedCategory: CategoryNode | null = null;

  for (const slug of slugs) {
    selectedCategory = currentCategories.find((category) => category.slug === slug) ?? null;

    if (!selectedCategory) {
      return null;
    }

    currentCategories = selectedCategory.subcategories;
  }

  return selectedCategory;
}
