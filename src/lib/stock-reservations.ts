import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

// Lock products first, in a stable order, so two carts cannot reserve the same last units.
export async function availableStock(connection: PoolConnection, ids: string[], ownCartId = "") {
  if (!ids.length) return new Map<string, number>();
  const [products] = await connection.query<RowDataPacket[]>("SELECT p.id, p.stock FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.activo = 1 AND c.activa = 1 AND p.id IN (?) ORDER BY p.id FOR UPDATE", [ids]);
  const [reservations] = await connection.query<RowDataPacket[]>("SELECT producto_id, cantidad FROM carrito_reservas WHERE producto_id IN (?) AND carrito_id <> ? ORDER BY producto_id, carrito_id FOR UPDATE", [ids, ownCartId]);
  const stock = new Map(products.map(p => [String(p.id), Number(p.stock)]));
  for (const r of reservations) stock.set(String(r.producto_id), Math.max(0, (stock.get(String(r.producto_id)) ?? 0) - Number(r.cantidad)));
  return stock;
}
