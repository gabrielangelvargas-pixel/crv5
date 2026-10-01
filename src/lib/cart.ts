import type { Product } from "../data/products";

export type CartItem = { productId: string; quantity: number };

export function getCartUnitPrice(product: Product, quantity: number) {
  return Math.min(product.salePrice, product.offerPrice ?? product.salePrice,
    ...product.priceTiers.filter((tier) => quantity >= tier.minimumQuantity).map((tier) => tier.unitPrice));
}

export function normalizeCart(value: unknown, products: Product[]): CartItem[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item.productId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;
    const product = products.find((entry) => entry.id === item.productId);
    if (!product || product.stock < 1) continue;
    quantities.set(product.id, Math.min(Math.floor(product.stock), (quantities.get(product.id) ?? 0) + item.quantity));
  }
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
}
