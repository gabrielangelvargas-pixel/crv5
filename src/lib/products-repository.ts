import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import type { Product } from "@/data/products";
import { getAssetUrl } from "@/lib/asset-url";
import { getDatabasePool } from "@/lib/db";

type ProductRow = RowDataPacket & {
  id: number | string | bigint;
  categoria_id: number | string | bigint;
  categoria_nombre: string;
  categoria_slug: string;
  subcategoria_nombre: string | null;
  subcategoria_slug: string | null;
  categoria_nieta_nombre: string | null;
  categoria_nieta_slug: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_venta: number | string;
  precio_oferta: number | string | null;
  stock: number | string;
  imagen_url: string | null;
  etiquetas: string | string[] | null;
};

function parseTags(value: ProductRow["etiquetas"]): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

export const getProducts = cache(async (): Promise<Product[]> => {
  try {
    const [rows] = await getDatabasePool().query<ProductRow[]>(`
      SELECT
        p.id,
        p.categoria_id,
        COALESCE(raiz.nombre, padre.nombre, categoria.nombre) AS categoria_nombre,
        COALESCE(raiz.slug, padre.slug, categoria.slug) AS categoria_slug,
        CASE
          WHEN raiz.id IS NULL AND padre.id IS NOT NULL THEN categoria.nombre
          WHEN raiz.id IS NOT NULL THEN padre.nombre
          ELSE NULL
        END AS subcategoria_nombre,
        CASE
          WHEN raiz.id IS NULL AND padre.id IS NOT NULL THEN categoria.slug
          WHEN raiz.id IS NOT NULL THEN padre.slug
          ELSE NULL
        END AS subcategoria_slug,
        CASE WHEN raiz.id IS NOT NULL THEN categoria.nombre ELSE NULL END AS categoria_nieta_nombre,
        CASE WHEN raiz.id IS NOT NULL THEN categoria.slug ELSE NULL END AS categoria_nieta_slug,
        p.codigo,
        p.nombre,
        p.descripcion,
        p.precio_venta,
        p.precio_oferta,
        p.stock,
        p.imagen_url,
        p.etiquetas
      FROM productos p
      INNER JOIN categorias categoria ON categoria.id = p.categoria_id
      LEFT JOIN categorias padre ON padre.id = categoria.parent_id
      LEFT JOIN categorias raiz ON raiz.id = padre.parent_id
      WHERE p.activo = 1 AND categoria.activa = 1
      ORDER BY p.orden, p.id
    `);

    return rows.map((row) => ({
      id: String(row.id),
      categoryId: String(row.categoria_id),
      category: row.categoria_nombre,
      categorySlug: row.categoria_slug,
      subcategory: row.subcategoria_nombre,
      subcategorySlug: row.subcategoria_slug,
      childCategory: row.categoria_nieta_nombre,
      childCategorySlug: row.categoria_nieta_slug,
      code: row.codigo,
      name: row.nombre,
      description: row.descripcion,
      salePrice: Number(row.precio_venta),
      offerPrice: row.precio_oferta === null ? null : Number(row.precio_oferta),
      stock: Number(row.stock),
      tags: parseTags(row.etiquetas),
      imageSrc: getAssetUrl(row.imagen_url, "productos"),
    }));
  } catch {
    return [];
  }
});

export const getLatestProducts = cache(async (limit = 8) => {
  const products = await getProducts();
  return products.slice(0, limit);
});
