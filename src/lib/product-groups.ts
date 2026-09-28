import type { Product, ProductGroup } from "@/data/products";

export function groupProducts(products: Product[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const product of products) {
    // Keep group IDs and product IDs in separate namespaces. A group can have
    // the same numeric ID as an unrelated standalone product.
    const groupId = product.groupId
      ? `group:${product.groupId}`
      : `product:${product.id}`;
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
