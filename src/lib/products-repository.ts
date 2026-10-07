import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import type { CartProduct, Product, ProductPriceTier } from "@/data/products";
import { getAssetUrl } from "@/lib/asset-url";
import { getDatabasePool } from "@/lib/db";

/** Invalidate with revalidateTag(CATALOG_TAG) whenever products or categories change. */
export const CATALOG_TAG = "catalog";

type ProductRow = RowDataPacket & {
  id: number | string | bigint;
  grupo_id: number | string | bigint | null;
  categoria_id: number | string | bigint;
  categoria_nombre: string;
  categoria_slug: string;
  subcategoria_nombre: string | null;
  subcategoria_slug: string | null;
  categoria_nieta_nombre: string | null;
  categoria_nieta_slug: string | null;
  codigo: string;
  nombre: string;
  variante: string | null;
  descripcion: string | null;
  precio_venta: number | string;
  precio_oferta: number | string | null;
  stock: number | string;
  imagen_url: string | null;
  etiquetas: string | string[] | null;
};

type ProductPriceRow = RowDataPacket & {
  producto_id: number | string | bigint;
  cantidad_minima: number | string;
  precio_unitario: number | string;
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

// Catalog with physical stock. Cached across requests; errors are thrown so a failed query is never cached.
const loadCatalog = unstable_cache(
  async (): Promise<Product[]> => {
    const pool = getDatabasePool();
    const [rows] = await pool.query<ProductRow[]>(`
      SELECT
        p.id,
        p.grupo_id,
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
        p.variante,
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

    const tiersByProduct = new Map<string, ProductPriceTier[]>();

    try {
      const [priceRows] = await pool.query<ProductPriceRow[]>(`
        SELECT producto_id, cantidad_minima, precio_unitario
        FROM producto_precios
        WHERE activo = 1
        ORDER BY producto_id, cantidad_minima
      `);

      for (const row of priceRows) {
        const productId = String(row.producto_id);
        const tiers = tiersByProduct.get(productId) ?? [];
        tiers.push({
          minimumQuantity: Number(row.cantidad_minima),
          unitPrice: Number(row.precio_unitario),
        });
        tiersByProduct.set(productId, tiers);
      }
    } catch {
      // The pricing table is optional while the product migration is in progress.
    }

    return rows.map((row) => ({
      id: String(row.id),
      groupId: row.grupo_id === null ? null : String(row.grupo_id),
      categoryId: String(row.categoria_id),
      category: row.categoria_nombre,
      categorySlug: row.categoria_slug,
      subcategory: row.subcategoria_nombre,
      subcategorySlug: row.subcategoria_slug,
      childCategory: row.categoria_nieta_nombre,
      childCategorySlug: row.categoria_nieta_slug,
      code: row.codigo,
      name: row.nombre,
      variantName: row.variante,
      description: row.descripcion,
      salePrice: Number(row.precio_venta),
      offerPrice: row.precio_oferta === null ? null : Number(row.precio_oferta),
      stock: Number(row.stock),
      tags: parseTags(row.etiquetas),
      imageSrc: getAssetUrl(row.imagen_url, "productos"),
      priceTiers: tiersByProduct.get(String(row.id)) ?? [],
    }));
  },
  ["catalog-products"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

// Reservations change with every cart review, so they are read fresh on each request.
async function loadReservations() {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>(
    "SELECT producto_id, SUM(cantidad) AS reservado FROM carrito_reservas GROUP BY producto_id",
  );
  return new Map(rows.map((row) => [String(row.producto_id), Number(row.reservado)]));
}

/** Active catalog with available stock (physical stock minus reservations). */
export const getProducts = cache(async (): Promise<Product[]> => {
  try {
    const [catalog, reserved] = await Promise.all([loadCatalog(), loadReservations()]);
    return catalog.map((product) => {
      const reservedUnits = reserved.get(product.id);
      return reservedUnits ? { ...product, stock: Math.max(0, product.stock - reservedUnits) } : product;
    });
  } catch (error) {
    console.error("No se pudieron cargar los productos", error);
    return [];
  }
});

export const getLatestProducts = cache(async (limit = 8) => {
  const products = await getProducts();
  return products.slice(0, limit);
});

function normalizeSearchValue(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export type ProductSearchResult = Pick<Product, "id" | "name" | "category" | "categorySlug" | "subcategory" | "subcategorySlug" | "salePrice" | "offerPrice">;

export async function searchProducts(query: string, limit = 6): Promise<ProductSearchResult[]> {
  const normalizedQuery = normalizeSearchValue(query);
  if (normalizedQuery.length < 2) return [];
  const products = await getProducts();
  return products
    .filter((product) =>
      normalizeSearchValue([product.name, product.code, product.category, product.subcategory, ...product.tags].join(" ")).includes(normalizedQuery),
    )
    .slice(0, limit)
    .map(({ id, name, category, categorySlug, subcategory, subcategorySlug, salePrice, offerPrice }) => ({ id, name, category, categorySlug, subcategory, subcategorySlug, salePrice, offerPrice }));
}

/** Display data for the products in a cart; `stock` overrides the catalog value with the transaction's figures. */
export async function getCartProducts(ids: string[], stock: Record<string, number> = {}): Promise<CartProduct[]> {
  if (!ids.length) return [];
  const wanted = new Set(ids);
  const products = await getProducts();
  return products
    .filter((product) => wanted.has(product.id))
    .map(({ id, code, name, variantName, imageSrc, salePrice, offerPrice, priceTiers, stock: catalogStock }) => ({
      id, code, name, variantName, imageSrc, salePrice, offerPrice, priceTiers, stock: stock[id] ?? catalogStock,
    }));
}
