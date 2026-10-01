import { describe, expect, it } from "vitest";
import type { Product } from "../data/products";
import { getCartUnitPrice, normalizeCart } from "./cart";

const product = { id: "a", stock: 10, salePrice: 100, offerPrice: 80, priceTiers: [{ minimumQuantity: 3, unitPrice: 90 }, { minimumQuantity: 6, unitPrice: 70 }] } as Product;

describe("precios del carrito", () => {
  it("elige el menor precio entre venta, oferta y escalas alcanzadas", () => {
    expect(getCartUnitPrice(product, 1)).toBe(80);
    expect(getCartUnitPrice(product, 3)).toBe(80);
    expect(getCartUnitPrice(product, 6)).toBe(70);
    expect(getCartUnitPrice({ ...product, offerPrice: null }, 3)).toBe(90);
    expect(getCartUnitPrice(product, 2)).toBe(80);
  });
});

describe("restauración y cantidades", () => {
  it("suma la misma variante y mantiene otras variantes separadas", () => {
    expect(normalizeCart([{ productId: "a", quantity: 2 }, { productId: "b", quantity: 4 }, { productId: "a", quantity: 1 }], [product, { ...product, id: "b" }])).toEqual([{ productId: "a", quantity: 3 }, { productId: "b", quantity: 4 }]);
  });
  it("limita stock y descarta productos eliminados, agotados y datos inválidos", () => {
    expect(normalizeCart([null, { productId: "a", quantity: 20 }, { productId: "b", quantity: 1 }, { productId: "x", quantity: 1 }, { productId: "a", quantity: -1 }, { productId: "a", quantity: 1.5 }], [product, { ...product, id: "b", stock: 0 }])).toEqual([{ productId: "a", quantity: 10 }]);
    expect(normalizeCart({}, [product])).toEqual([]);
  });
});
