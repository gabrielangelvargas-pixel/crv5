import { describe, expect, it } from "vitest";
import { toSlug } from "../lib/slug";
import { mockCategories } from "./mock-categories";
import { mockProducts } from "./mock-products";

describe("mockCategories", () => {
  it("define slugs unicos por cada nivel de la jerarquia", () => {
    const categorySlugs = mockCategories.map((category) => toSlug(category.name));

    expect(new Set(categorySlugs).size).toBe(categorySlugs.length);

    for (const category of mockCategories) {
      const subcategorySlugs = category.subcategories.map((subcategory) =>
        toSlug(subcategory.name),
      );

      expect(new Set(subcategorySlugs).size).toBe(subcategorySlugs.length);

      for (const subcategory of category.subcategories) {
        const childCategorySlugs =
          subcategory.children?.map((childCategory) => toSlug(childCategory.name)) ?? [];

        expect(new Set(childCategorySlugs).size).toBe(childCategorySlugs.length);
      }
    }
  });

  it("contiene la jerarquia usada por los productos mock", () => {
    for (const product of mockProducts) {
      const category = mockCategories.find(
        (mockCategory) => mockCategory.name === product.category,
      );
      const subcategory = category?.subcategories.find(
        (mockSubcategory) => mockSubcategory.name === product.subcategory,
      );
      const childCategory = subcategory?.children?.find(
        (mockChildCategory) => mockChildCategory.name === product.childCategory,
      );

      expect(category, `Categoria faltante: ${product.category}`).toBeDefined();
      expect(
        subcategory,
        `Subcategoria faltante: ${product.category} / ${product.subcategory}`,
      ).toBeDefined();

      if (product.childCategory) {
        expect(
          childCategory,
          `Categoria nieta faltante: ${product.category} / ${product.subcategory} / ${product.childCategory}`,
        ).toBeDefined();
      }
    }
  });
});
