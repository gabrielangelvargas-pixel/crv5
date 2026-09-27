import { describe, expect, it } from "vitest";
import { mockProducts } from "./mock-products";

describe("mockProducts", () => {
  it("contiene 31 productos mock con placeholder de imagen", () => {
    expect(mockProducts).toHaveLength(31);
    expect(mockProducts.every((product) => product.imageSrc === null)).toBe(true);
  });
});
