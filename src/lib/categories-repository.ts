import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import type { CategoryIconKey, CategoryNode } from "@/data/categories";
import { getAssetUrl } from "@/lib/asset-url";
import { getDatabasePool } from "@/lib/db";

type CategoryRow = RowDataPacket & {
  id: number | string | bigint;
  parent_id: number | string | bigint | null;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  portada_url: string | null;
};

function getIconKey(slug: string): CategoryIconKey {
  const iconBySlug: Record<string, CategoryIconKey> = {
    accesorios: "star",
    belleza: "paintbrush",
    bijouterie: "gem",
    libreria: "pen",
    marroquineria: "bag",
    piercing: "heart",
    regaleria: "heart",
    tecnologia: "tablet",
  };

  return iconBySlug[slug] ?? "default";
}

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const [rows] = await getDatabasePool().query<CategoryRow[]>(`
    SELECT id, parent_id, nombre, descripcion, slug, imagen_url, portada_url
    FROM categorias
    WHERE activa = 1
    ORDER BY parent_id IS NOT NULL, parent_id, orden, id
  `);

  const nodes = new Map<string, CategoryNode>();

  for (const row of rows) {
    const id = String(row.id);
    const parentId = row.parent_id === null ? null : String(row.parent_id);

    nodes.set(id, {
      id,
      parentId,
      name: row.nombre,
      slug: row.slug,
      description: row.descripcion,
      imageSrc: getAssetUrl(row.imagen_url, "categorias"),
      coverImageSrc: getAssetUrl(row.portada_url, "portadas"),
      iconKey: getIconKey(row.slug),
      subcategories: [],
    });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(node.parentId);
    if (parent) {
      parent.subcategories.push(node);
    }
  }

  const inheritMetadata = (
    category: CategoryNode,
    inherited: Pick<CategoryNode, "description" | "imageSrc"> | null,
  ) => {
    category.description = category.description ?? inherited?.description ?? null;
    category.imageSrc = category.imageSrc ?? inherited?.imageSrc ?? null;

    for (const child of category.subcategories) {
      inheritMetadata(child, category);
    }
  };

  for (const root of roots) {
    inheritMetadata(root, null);
  }

  return roots;
});
