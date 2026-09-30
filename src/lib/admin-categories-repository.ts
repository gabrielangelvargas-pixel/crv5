import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDatabasePool } from "@/lib/db";

export type AdminCategory = {
  id: string;
  parentId: string | null;
  parentName: string | null;
  name: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  coverUrl: string | null;
  order: number;
  active: boolean;
  depth: number;
};

type CategoryRow = RowDataPacket & {
  id: number | string | bigint;
  parent_id: number | string | bigint | null;
  parent_nombre: string | null;
  nombre: string;
  descripcion: string | null;
  slug: string;
  imagen_url: string | null;
  portada_url: string | null;
  orden: number | string;
  activa: number;
};

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const [rows] = await getDatabasePool().query<CategoryRow[]>(`
    SELECT c.id, c.parent_id, parent.nombre AS parent_nombre, c.nombre, c.descripcion,
      c.slug, c.imagen_url, c.portada_url, c.orden, c.activa
    FROM categorias c
    LEFT JOIN categorias parent ON parent.id = c.parent_id
    ORDER BY c.orden, c.id
  `);

  const categories = rows.map((row) => ({
    id: String(row.id),
    parentId: row.parent_id === null ? null : String(row.parent_id),
    parentName: row.parent_nombre,
    name: row.nombre,
    description: row.descripcion,
    slug: row.slug,
    imageUrl: row.imagen_url,
    coverUrl: row.portada_url,
    order: Number(row.orden),
    active: Boolean(row.activa),
    depth: 0,
  }));

  const byParent = new Map<string | null, AdminCategory[]>();
  for (const category of categories) {
    const siblings = byParent.get(category.parentId) ?? [];
    siblings.push(category);
    byParent.set(category.parentId, siblings);
  }

  const sortSiblings = (siblings: AdminCategory[]) => siblings.sort((first, second) => first.order - second.order || Number(first.id) - Number(second.id));
  const ordered: AdminCategory[] = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const category of sortSiblings(byParent.get(parentId) ?? [])) {
      category.depth = depth;
      ordered.push(category);
      visit(category.id, depth + 1);
    }
  };

  visit(null, 0);
  for (const category of categories) {
    if (!ordered.includes(category)) {
      category.depth = 0;
      ordered.push(category);
    }
  }

  return ordered;
}

export type CategoryInput = {
  parentId: string | null;
  name: string;
  description: string;
  slug: string;
  imageUrl: string;
  coverUrl: string;
  order: number;
  active: boolean;
};

export async function saveAdminCategory(id: string | undefined, input: CategoryInput) {
  if (id && input.parentId === id) throw new Error("Una categoría no puede ser su propia padre");
  const pool = getDatabasePool();
  if (input.parentId) {
    const [parentRows] = await pool.query<RowDataPacket[]>("SELECT id FROM categorias WHERE id = ? LIMIT 1", [input.parentId]);
    if (!parentRows[0]) throw new Error("La categoría padre no existe");
  }

  if (id) {
    await pool.query(
      `UPDATE categorias SET parent_id = ?, nombre = ?, descripcion = ?, slug = ?, imagen_url = ?, portada_url = ?, orden = ?, activa = ? WHERE id = ?`,
      [input.parentId, input.name.trim(), input.description.trim() || null, input.slug.trim(), input.imageUrl.trim() || null, input.coverUrl.trim() || null, input.order, input.active ? 1 : 0, id],
    );
    return;
  }

  await pool.query<ResultSetHeader>(
    `INSERT INTO categorias (parent_id, nombre, descripcion, slug, imagen_url, portada_url, orden, activa) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.parentId, input.name.trim(), input.description.trim() || null, input.slug.trim(), input.imageUrl.trim() || null, input.coverUrl.trim() || null, input.order, input.active ? 1 : 0],
  );
}
