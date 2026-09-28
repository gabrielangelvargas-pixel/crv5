import { describe, expect, it } from "vitest";
import { toSlug } from "../lib/slug";
import { mockCategories } from "./mock-categories";

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
});
