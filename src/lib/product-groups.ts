import type { Product, ProductGroup } from "@/data/products";

export function groupProducts(products: Product[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const product of products) {
    const groupId = product.groupId ?? product.id;
    const group = groups.get(groupId);

    if (group) {
      group.variants.push(product);
      continue;
    }

    groups.set(groupId, {
      id: groupId,
      product,
      variants: [product],
    });
  }

  return [...groups.values()];
}
