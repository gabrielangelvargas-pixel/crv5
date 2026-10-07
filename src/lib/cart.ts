import type { Product } from "../data/products";

export type CartItem = { productId: string; quantity: number };

export function getCartUnitPrice(product: Pick<Product, "salePrice" | "offerPrice" | "priceTiers">, quantity: number) {
  return Math.min(product.salePrice, product.offerPrice ?? product.salePrice,
    ...product.priceTiers.filter((tier) => quantity >= tier.minimumQuantity).map((tier) => tier.unitPrice));
}

/**
 * Merges duplicate lines and clamps to the stock of known products. The browser only knows the
 * products already in its cart, so unknown ids are kept as-is and validated by the server.
 */
export function normalizeCart(value: unknown, products: Pick<Product, "id" | "stock">[]): CartItem[] {
  if (!Array.isArray(value)) return [];
  const stockById = new Map(products.map((product) => [product.id, product.stock]));
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item.productId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;
    const stock = stockById.get(item.productId);
    if (stock !== undefined && stock < 1) continue;
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    quantities.set(item.productId, stock === undefined ? quantity : Math.min(Math.floor(stock), quantity));
  }
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
}
