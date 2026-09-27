import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import type { CategoryIconKey, CategoryNode } from "@/data/categories";
import { getDatabasePool } from "@/lib/db";

type CategoryRow = RowDataPacket & {
  id: number | string | bigint;
  parent_id: number | string | bigint | null;
  nombre: string;
  slug: string;
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

function toPublicAssetUrl(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().replaceAll("\\", "/");

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const publicRelativePath = normalizedValue.replace(/^\/?public\//i, "");

  return `/${publicRelativePath.replace(/^\/+/, "")}`;
}

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const [rows] = await getDatabasePool().query<CategoryRow[]>(`
    SELECT id, parent_id, nombre, slug, imagen_url, portada_url
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
      imageSrc: toPublicAssetUrl(row.imagen_url),
      coverImageSrc: toPublicAssetUrl(row.portada_url),
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

  return roots;
});
