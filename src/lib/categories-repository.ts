import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import type { CategoryIconKey, CategoryNode } from "@/data/categories";
import { getAssetUrl } from "@/lib/asset-url";
import { getDatabasePool } from "@/lib/db";
import { CATALOG_TAG } from "@/lib/products-repository";

type CategoryRow = RowDataPacket & {
  id: number | string | bigint;
  parent_id: number | string | bigint | null;
  orden: number | string | bigint;
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

function isMissingDescriptionColumn(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  return (
    error.code === "ER_BAD_FIELD_ERROR" &&
    "sqlMessage" in error &&
    typeof error.sqlMessage === "string" &&
    error.sqlMessage.includes("descripcion")
  );
}

// Cached across requests (invalidated with CATALOG_TAG); errors are thrown so a failed query is never cached.
const loadCategoryTree = unstable_cache(async (): Promise<CategoryNode[]> => {
  let rows: CategoryRow[];

  try {
    [rows] = await getDatabasePool().query<CategoryRow[]>(`
      SELECT id, parent_id, nombre, descripcion, slug, imagen_url, portada_url, orden
      FROM categorias
      WHERE activa = 1
      ORDER BY parent_id IS NOT NULL, parent_id, orden, id
    `);
  } catch (error) {
    if (!isMissingDescriptionColumn(error)) throw error;

    [rows] = await getDatabasePool().query<CategoryRow[]>(`
      SELECT id, parent_id, nombre, NULL AS descripcion, slug, imagen_url, portada_url, orden
      FROM categorias
      WHERE activa = 1
      ORDER BY parent_id IS NOT NULL, parent_id, orden, id
    `);
  }

  const nodes = new Map<string, CategoryNode>();

  for (const row of rows) {
    const id = String(row.id);
    const parentId = row.parent_id === null ? null : String(row.parent_id);

    nodes.set(id, {
      id,
      parentId,
      order: Number(row.orden),
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
    visited = new Set<string>(),
  ) => {
    if (visited.has(category.id)) return;
    const nextVisited = new Set(visited).add(category.id);
    category.description = category.description ?? inherited?.description ?? null;
    category.imageSrc = category.imageSrc ?? inherited?.imageSrc ?? null;

    for (const child of category.subcategories) {
      inheritMetadata(child, category, nextVisited);
    }
  };

  for (const root of roots) {
    inheritMetadata(root, null);
  }

  return roots;
}, ["category-tree"], { tags: [CATALOG_TAG], revalidate: 300 });

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  try {
    return await loadCategoryTree();
  } catch (error) {
    console.error("No se pudieron cargar las categorías", error);
    return [];
  }
});

// Visit ranking only needs to be roughly current.
const loadCategoryPopularity = unstable_cache(async (): Promise<[string, number][]> => {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>(`
    SELECT categoria_id, SUM(visitas) AS visitas
    FROM categoria_visitas
    WHERE fecha >= (CURRENT_DATE - INTERVAL 30 DAY)
    GROUP BY categoria_id
  `);
  return rows.map((row) => [String(row.categoria_id), Number(row.visitas)]);
}, ["category-popularity"], { revalidate: 3600 });

export const getMostVisitedCategories = cache(async (limit = 4) => {
  const categories = await getCategoryTree();

  try {
    const popularity = new Map(await loadCategoryPopularity());

    return [...categories]
      .sort((first, second) => {
        const visitDifference =
          (popularity.get(second.id) ?? 0) - (popularity.get(first.id) ?? 0);

        return visitDifference || first.order - second.order || first.name.localeCompare(second.name, "es");
      })
      .slice(0, limit);
  } catch {
    return categories.slice(0, limit);
  }
});
