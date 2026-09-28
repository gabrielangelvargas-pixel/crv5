export type Product = {
  id: string;
  categoryId: string;
  category: string;
  categorySlug: string;
  subcategory: string | null;
  subcategorySlug: string | null;
  childCategory: string | null;
  childCategorySlug: string | null;
  code: string;
  name: string;
  description: string | null;
  salePrice: number;
  offerPrice: number | null;
  stock: number;
  tags: string[];
  imageSrc: string | null;
};
