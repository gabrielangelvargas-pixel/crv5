export type Product = {
  id: string;
  groupId: string | null;
  categoryId: string;
  category: string;
  categorySlug: string;
  subcategory: string | null;
  subcategorySlug: string | null;
  childCategory: string | null;
  childCategorySlug: string | null;
  code: string;
  name: string;
  variantName: string | null;
  description: string | null;
  salePrice: number;
  offerPrice: number | null;
  stock: number;
  tags: string[];
  imageSrc: string | null;
  priceTiers: ProductPriceTier[];
};

export type ProductGroup = {
  id: string;
  product: Product;
  variants: Product[];
};

export type ProductPriceTier = {
  minimumQuantity: number;
  unitPrice: number;
};
