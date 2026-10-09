import type { Product, ProductGroup } from "@/data/products";

/**
 * Groups variants the same way the storefront builds its cards: products sharing a group become
 * one entry, products without a group stand alone. Preserves the order of first appearance.
 */
export function groupByProductGroup<T extends { id: string; groupId: string | null }>(items: T[]) {
  const groups = new Map<string, { id: string; variants: T[] }>();

  for (const item of items) {
    // Keep group IDs and product IDs in separate namespaces. A group can have
    // the same numeric ID as an unrelated standalone product.
    const groupId = item.groupId ? `group:${item.groupId}` : `product:${item.id}`;
    const group = groups.get(groupId);

    if (group) {
      group.variants.push(item);
    } else {
      groups.set(groupId, { id: groupId, variants: [item] });
    }
  }

  return [...groups.values()];
}

export function groupProducts(products: Product[]): ProductGroup[] {
  return groupByProductGroup(products).map(({ id, variants }) => ({ id, product: variants[0]!, variants }));
}
