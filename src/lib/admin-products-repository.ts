import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { getDatabasePool } from "@/lib/db";

export type AdminProductPrice = { minimumQuantity: number; unitPrice: number };

export type AdminProduct = {
  id: string;
  groupId: string | null;
  groupName: string | null;
  categoryId: string;
  categoryName: string;
  code: string;
  name: string;
  variantName: string | null;
  slug: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  offerPrice: number | null;
  stock: number;
  availableStock: number;
  imageUrl: string | null;
  order: number;
  active: boolean;
  priceTiers: AdminProductPrice[];
};

export type AdminProductGroup = { id: string; name: string; slug: string; categoryId: string; };

type ProductRow = RowDataPacket & {
  id: number | string | bigint;
  grupo_id: number | string | bigint | null;
  grupo_nombre: string | null;
  categoria_id: number | string | bigint;
  categoria_nombre: string;
  codigo: string;
  nombre: string;
  variante: string | null;
  slug: string;
  descripcion: string | null;
  precio_costo: number | string;
  precio_venta: number | string;
  precio_oferta: number | string | null;
  stock: number | string;
  stock_disponible: number | string;
  imagen_url: string | null;
  orden: number | string;
  activo: number;
};

type PriceRow = RowDataPacket & { producto_id: number | string | bigint; cantidad_minima: number | string; precio_unitario: number | string };
type GroupRow = RowDataPacket & { id: number | string | bigint; nombre: string; slug: string; categoria_id: number | string | bigint };

export async function getAdminProducts() {
  const pool = getDatabasePool();
  const [rows] = await pool.query<ProductRow[]>(`
    SELECT p.id, p.grupo_id, g.nombre AS grupo_nombre, p.categoria_id, c.nombre AS categoria_nombre,
      p.codigo, p.nombre, p.variante, p.slug, p.descripcion, p.precio_costo, p.precio_venta, p.precio_oferta,
      p.stock, GREATEST(p.stock - COALESCE((SELECT SUM(r.cantidad) FROM carrito_reservas r WHERE r.producto_id = p.id), 0), 0) AS stock_disponible, p.imagen_url, p.orden, p.activo
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN producto_grupos g ON g.id = p.grupo_id
    ORDER BY p.activo DESC, COALESCE(g.nombre, p.nombre), p.orden, p.id
  `);
  const [priceRows] = await pool.query<PriceRow[]>(`
    SELECT producto_id, cantidad_minima, precio_unitario
    FROM producto_precios WHERE activo = 1 ORDER BY producto_id, cantidad_minima
  `);
  const prices = new Map<string, AdminProductPrice[]>();
  for (const row of priceRows) {
    const id = String(row.producto_id);
    prices.set(id, [...(prices.get(id) ?? []), { minimumQuantity: Number(row.cantidad_minima), unitPrice: Number(row.precio_unitario) }]);
  }

  return rows.map((row): AdminProduct => ({
    id: String(row.id), groupId: row.grupo_id === null ? null : String(row.grupo_id), groupName: row.grupo_nombre,
    categoryId: String(row.categoria_id), categoryName: row.categoria_nombre, code: row.codigo, name: row.nombre,
    variantName: row.variante, slug: row.slug, description: row.descripcion, costPrice: Number(row.precio_costo), salePrice: Number(row.precio_venta),
    offerPrice: row.precio_oferta === null ? null : Number(row.precio_oferta), stock: Number(row.stock), availableStock: Number(row.stock_disponible),
    imageUrl: row.imagen_url, order: Number(row.orden), active: Boolean(row.activo), priceTiers: prices.get(String(row.id)) ?? [],
  }));
}

export async function getAdminProductGroups() {
  const [rows] = await getDatabasePool().query<GroupRow[]>("SELECT id, nombre, slug, categoria_id FROM producto_grupos WHERE activo = 1 ORDER BY nombre ASC");
  return rows.map((row) => ({ id: String(row.id), name: row.nombre, slug: row.slug, categoryId: String(row.categoria_id) }));
}

export type ProductInput = {
  id: string | undefined; groupId: string | null; newGroupName: string; newGroupSlug: string; categoryId: string;
  code: string; name: string; variantName: string; slug: string; description: string; costPrice: number; salePrice: number;
  offerPrice: number | null; stock: number; imageUrl: string; order: number; active: boolean; priceTiers: AdminProductPrice[];
};

async function ensureCategory(connection: PoolConnection, categoryId: string) {
  const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM categorias WHERE id = ? AND activa = 1 LIMIT 1", [categoryId]);
  if (!rows[0]) throw new Error("La categoría seleccionada no existe o está inactiva");
}

async function resolveGroup(connection: PoolConnection, input: ProductInput) {
  if (input.groupId === "__new__" && !input.newGroupName.trim()) throw new Error("Completá el nombre del grupo nuevo");
  if (input.newGroupName.trim()) {
    if (!input.newGroupSlug.trim()) throw new Error("El grupo nuevo necesita un slug");
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO producto_grupos (categoria_id, nombre, slug, activo) VALUES (?, ?, ?, 1)",
      [input.categoryId, input.newGroupName.trim(), input.newGroupSlug.trim()],
    );
    return String(result.insertId);
  }
  if (!input.groupId) return null;
  const [rows] = await connection.query<RowDataPacket[]>("SELECT id FROM producto_grupos WHERE id = ? AND activo = 1 LIMIT 1", [input.groupId]);
  if (!rows[0]) throw new Error("El grupo seleccionado no existe");
  return input.groupId;
}

export async function saveAdminProduct(input: ProductInput) {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureCategory(connection, input.categoryId);
    const groupId = await resolveGroup(connection, input);
    const values = [groupId, input.categoryId, input.code.trim(), input.name.trim(), input.variantName.trim() || null, input.slug.trim(), input.description.trim() || null, input.costPrice, input.salePrice, input.offerPrice, input.stock, input.imageUrl.trim() || null, input.order, input.active ? 1 : 0];
    let productId = input.id;
    if (productId) {
      await connection.query("SELECT id FROM productos WHERE id = ? FOR UPDATE", [productId]);
      const [reserved] = await connection.query<RowDataPacket[]>("SELECT cantidad FROM carrito_reservas WHERE producto_id = ? FOR UPDATE", [productId]);
      if (input.stock < reserved.reduce((sum, row) => sum + Number(row.cantidad), 0)) throw new Error("El stock no puede ser menor que las unidades reservadas.");

      await connection.query(
        `UPDATE productos SET grupo_id = ?, categoria_id = ?, codigo = ?, nombre = ?, variante = ?, slug = ?, descripcion = ?, precio_costo = ?, precio_venta = ?, precio_oferta = ?, stock = ?, imagen_url = ?, orden = ?, activo = ? WHERE id = ?`,
        [...values, productId],
      );
    } else {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO productos (grupo_id, categoria_id, codigo, nombre, variante, slug, descripcion, precio_costo, precio_venta, precio_oferta, stock, imagen_url, orden, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
      );
      productId = String(result.insertId);
    }

    await connection.query("DELETE FROM producto_precios WHERE producto_id = ?", [productId]);
    for (const tier of input.priceTiers) {
      await connection.query("INSERT INTO producto_precios (producto_id, cantidad_minima, precio_unitario, activo) VALUES (?, ?, ?, 1)", [productId, tier.minimumQuantity, tier.unitPrice]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
