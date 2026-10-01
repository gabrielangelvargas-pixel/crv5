import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import type { CartItem } from "./cart";
import { getDatabasePool } from "./db";
import type { OrderDelivery, OrderLine } from "./orders-repository";

export class ConfirmedCartError extends Error {}
async function priceItems(connection: PoolConnection, items: CartItem[]) {
  if (!items.length) throw new ConfirmedCartError("El carrito debe tener al menos un producto.");
  const ids = items.map(i => i.productId);
  const [products] = await connection.query<RowDataPacket[]>("SELECT p.* FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.id IN (?) AND p.activo = 1 AND c.activa = 1 ORDER BY p.id FOR UPDATE", [ids]);
  const [tiers] = await connection.query<RowDataPacket[]>("SELECT producto_id, cantidad_minima, precio_unitario FROM producto_precios WHERE producto_id IN (?) AND activo = 1", [ids]);
  const lines = items.map((item): OrderLine => {
    const p = products.find(p => String(p.id) === item.productId);
    if (!p || Number(p.stock) < item.quantity) throw new ConfirmedCartError("Stock insuficiente o producto no disponible. Revisá las cantidades.");
    const cents = Math.min(...[Number(p.precio_venta), Number(p.precio_oferta ?? p.precio_venta), ...tiers.filter(t => String(t.producto_id) === item.productId && Number(t.cantidad_minima) <= item.quantity).map(t => Number(t.precio_unitario))].map(v => Math.round(v * 100)));
    return { productId: item.productId, code: String(p.codigo), name: String(p.nombre), variant: p.variante === null ? null : String(p.variante), quantity: item.quantity, unitPrice: cents / 100, subtotal: cents * item.quantity / 100 };
  });
  return { lines, total: lines.reduce((s, l) => s + Math.round(l.subtotal * 100), 0) / 100 };
}

export async function confirmCart(userId: string, input: { version: number; expectedTotalCents: number; delivery: OrderDelivery }) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", [userId]);
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM carritos WHERE usuario_id = ? AND estado IN ('activo','confirmado','actualizado') FOR UPDATE", [userId]);
    const cart = rows[0];
    if (!cart) throw new ConfirmedCartError("Tu carrito está vacío.");
    // Retry of the same submission is harmless; an administrative revision is never accepted here.
    if (cart.estado === "confirmado" && Number(cart.version) === input.version + 1) { await connection.commit(); return { id: String(cart.id), version: Number(cart.version) }; }
    if (Number(cart.version) !== input.version) throw new ConfirmedCartError("El carrito cambió. Revisá las cantidades antes de confirmar.");
    if (cart.estado !== "activo") throw new ConfirmedCartError("El carrito ya fue enviado. La aceptación de cambios se habilitará en el próximo paso.");
    const items: CartItem[] = typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items;
    const priced = await priceItems(connection, items);
    if (Math.round(priced.total * 100) !== input.expectedTotalCents) throw new ConfirmedCartError("Los precios cambiaron. Actualizá la página y revisá el total.");
    await connection.query("UPDATE carritos SET estado = 'confirmado', entrega = ?, productos_confirmados = ?, total_estimado = ?, confirmado_en = NOW(), ultima_actividad = NOW(), version = version + 1 WHERE id = ?", [JSON.stringify(input.delivery), JSON.stringify(priced.lines), priced.total, cart.id]);
    await connection.commit();
    return { id: String(cart.id), version: Number(cart.version) + 1 };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function updateConfirmedCart(id: string, input: { version: number; items: CartItem[] }) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>("SELECT estado, version FROM carritos WHERE id = ? FOR UPDATE", [id]);
    const cart = rows[0];
    if (!cart || !["confirmado", "actualizado"].includes(cart.estado)) throw new ConfirmedCartError("Solo se pueden editar carritos confirmados o actualizados.");
    if (Number(cart.version) !== input.version) throw new ConfirmedCartError("El carrito cambió. Actualizá la página antes de editarlo.");
    const priced = await priceItems(connection, input.items);
    await connection.query("UPDATE carritos SET items = ?, productos_confirmados = ?, total_estimado = ?, estado = 'actualizado', version = version + 1, ultima_actividad = NOW() WHERE id = ?", [JSON.stringify(input.items), JSON.stringify(priced.lines), priced.total, id]);
    await connection.commit();
    return { ...priced, version: Number(cart.version) + 1 };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
