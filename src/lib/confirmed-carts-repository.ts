import { cartPayableCents, type CartAdjustment } from "./cart-adjustments";
import { availableStock } from "./stock-reservations";
import { notifyCartSubmitted } from "./cart-notifications";
import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import type { CartItem } from "./cart";
import { getDatabasePool } from "./db";
import type { OrderDelivery, OrderLine } from "./orders-repository";

export class ConfirmedCartError extends Error {}
export type ReviewedCartItem = CartItem & { reserved?: boolean | undefined; exhausted?: boolean | undefined };
async function priceItems(connection: PoolConnection, items: ReviewedCartItem[], review = false, ownCartId = "") {
  if (!items.length) throw new ConfirmedCartError("El carrito debe tener al menos un producto.");
  const ids = items.map(i => i.productId);
  const [products] = await connection.query<RowDataPacket[]>("SELECT p.* FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.id IN (?) AND p.activo = 1 AND c.activa = 1 ORDER BY p.id FOR UPDATE", [ids]);
  const stock = await availableStock(connection, ids, ownCartId);
  const [tiers] = await connection.query<RowDataPacket[]>("SELECT producto_id, cantidad_minima, precio_unitario FROM producto_precios WHERE producto_id IN (?) AND activo = 1", [ids]);
  const lines = items.map((item): OrderLine => {
    const p = products.find(p => String(p.id) === item.productId);
    if (!p || ((!review || (item.reserved === true && !item.exhausted)) && (stock.get(item.productId) ?? 0) < item.quantity)) throw new ConfirmedCartError("Stock insuficiente o producto no disponible. Revisá las cantidades.");
    const cents = Math.min(...[Number(p.precio_venta), Number(p.precio_oferta ?? p.precio_venta), ...tiers.filter(t => String(t.producto_id) === item.productId && Number(t.cantidad_minima) <= item.quantity).map(t => Number(t.precio_unitario))].map(v => Math.round(v * 100)));
    return { productId: item.productId, code: String(p.codigo), name: String(p.nombre), variant: p.variante === null ? null : String(p.variante), quantity: item.quantity, unitPrice: cents / 100, subtotal: review && item.exhausted ? 0 : cents * item.quantity / 100, reserved: review && item.reserved === true && !item.exhausted, exhausted: review && item.exhausted === true };
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
    const priced = await priceItems(connection, items, false, String(cart.id));
    if (Math.round(priced.total * 100) !== input.expectedTotalCents) throw new ConfirmedCartError("Los precios cambiaron. Actualizá la página y revisá el total.");
    const previousLines = (typeof cart.productos_confirmados === "string" ? JSON.parse(cart.productos_confirmados) : cart.productos_confirmados ?? []) as OrderLine[];
    priced.lines.push(...previousLines.filter(line => line.exhausted && !items.some(item => item.productId === line.productId)));
    await connection.query("UPDATE carritos SET estado = 'confirmado', entrega = ?, productos_confirmados = ?, total_estimado = ?, confirmado_en = NOW(), ultima_actividad = NOW(), version = version + 1 WHERE id = ?", [JSON.stringify(input.delivery), JSON.stringify(priced.lines), priced.total, cart.id]);
    await notifyCartSubmitted(connection, { cartId: String(cart.id), userId, version: Number(cart.version) + 1, products: items.length, units: items.reduce((sum, item) => sum + item.quantity, 0), total: priced.total });
    await connection.commit();
    return { id: String(cart.id), version: Number(cart.version) + 1 };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function updateConfirmedCart(id: string, input: { version: number; items: ReviewedCartItem[]; adjustments?: CartAdjustment[] | undefined }) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>("SELECT estado, version, ajustes FROM carritos WHERE id = ? FOR UPDATE", [id]);
    const cart = rows[0];
    if (!cart || !["confirmado", "actualizado"].includes(cart.estado)) throw new ConfirmedCartError("Solo se pueden editar carritos confirmados o actualizados.");
    if (Number(cart.version) !== input.version) throw new ConfirmedCartError("El carrito cambió. Actualizá la página antes de editarlo.");
    const priced = await priceItems(connection, input.items, true, id);
    const adjustments: CartAdjustment[] = input.adjustments ?? (typeof cart.ajustes === "string" ? JSON.parse(cart.ajustes) : cart.ajustes ?? []);
    if (adjustments.length > 50 || adjustments.some(item => !item.description.trim() || item.description.length > 120 || !Number.isSafeInteger(item.amountCents) || Math.abs(item.amountCents) > 100000000000)) throw new ConfirmedCartError("Revisá los conceptos y sus importes.");
    const payableCents = cartPayableCents(priced.total, adjustments);
    if (payableCents < 0 || payableCents > 99999999999999) throw new ConfirmedCartError("El total a pagar debe ser mayor o igual a cero y estar dentro del límite permitido.");
    await connection.query("DELETE FROM carrito_reservas WHERE carrito_id = ?", [id]);
    for (const line of priced.lines.filter(l => l.reserved)) await connection.query("INSERT INTO carrito_reservas (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)", [id, line.productId, line.quantity]);
    await connection.query("UPDATE carritos SET items = ?, productos_confirmados = ?, ajustes = ?, total_estimado = ?, estado = 'actualizado', version = version + 1, ultima_actividad = NOW() WHERE id = ?", [JSON.stringify(input.items.filter(item => !item.exhausted).map(({ productId, quantity }) => ({ productId, quantity }))), JSON.stringify(priced.lines), JSON.stringify(adjustments), priced.total, id]);
    await connection.commit();
    return { ...priced, adjustments, payableTotal: payableCents / 100, version: Number(cart.version) + 1 };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
