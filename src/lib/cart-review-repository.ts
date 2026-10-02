import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDatabasePool } from "./db";
import { availableStock } from "./stock-reservations";
import { ConfirmedCartError } from "./confirmed-carts-repository";
import { cartPayableCents, type CartAdjustment } from "./cart-adjustments";
import { notifyOrderAccepted } from "./cart-notifications";
import type { OrderLine, OrderDelivery } from "./orders-repository";
const json = <T>(value: string | T): T => typeof value === "string" ? JSON.parse(value) : value;
export async function respondToCartReview(userId: string, input: { cartId: string; version: number; action: "continue" | "accept"; expectedTotalCents?: number | undefined }) {
 const connection = await getDatabasePool().getConnection();
 try {
  await connection.beginTransaction();
  await connection.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", [userId]);
  const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM carritos WHERE id = ? FOR UPDATE", [input.cartId]);
  const cart = rows[0];
  if (cart?.pedido_id && input.action === "accept") {
   const [orders] = await connection.query<RowDataPacket[]>("SELECT id FROM pedidos WHERE id = ? AND usuario_id = ?", [cart.pedido_id, userId]);
   if (orders[0]) { await connection.commit(); return { orderId: String(orders[0].id), status: "confirmado" }; }
  }
  if (!cart || cart.pedido_id || String(cart.usuario_id) !== userId) throw new ConfirmedCartError("El carrito no está disponible para tu cuenta.");
  if (Number(cart.version) !== input.version) throw new ConfirmedCartError("El carrito cambió. Revisá la última actualización antes de continuar.");
  if (input.action === "continue") {
   if (!["confirmado", "actualizado"].includes(cart.estado)) throw new ConfirmedCartError("El carrito ya está activo o no puede modificarse.");
   const lines = json<OrderLine[]>(cart.productos_confirmados ?? []).filter(line => line.exhausted);
   await connection.query("DELETE FROM carrito_reservas WHERE carrito_id = ?", [cart.id]);
   await connection.query("UPDATE carritos SET estado = 'activo', version = version + 1, productos_confirmados = ?, total_estimado = NULL, confirmado_en = NULL, ultima_actividad = NOW() WHERE id = ?", [lines.length ? JSON.stringify(lines) : null, cart.id]);
   await connection.commit(); return { status: "activo", orderId: null };
  }
  if (cart.estado !== "actualizado") throw new ConfirmedCartError("Administración debe revisar el carrito antes de confirmar y pagar.");
  const lines = json<OrderLine[]>(cart.productos_confirmados ?? []);
  const active = lines.filter(line => !line.exhausted);
  if (!active.length) throw new ConfirmedCartError("El carrito no tiene productos disponibles para generar un pedido.");
  const subtotal = active.reduce((sum, line) => sum + Math.round(line.subtotal * 100), 0) / 100;
  const adjustments = json<CartAdjustment[]>(cart.ajustes ?? []);
  const totalCents = cartPayableCents(subtotal, adjustments);
  if (totalCents < 0 || totalCents !== input.expectedTotalCents) throw new ConfirmedCartError("El importe cambió. Revisá el total a pagar.");
  const stock = await availableStock(connection, active.map(line => line.productId), cart.id);
  if (active.some(line => (stock.get(line.productId) ?? 0) < line.quantity)) throw new ConfirmedCartError("Cambió la disponibilidad. Administración debe revisar los productos antes de confirmar.");
  await connection.query("DELETE FROM carrito_reservas WHERE carrito_id = ?", [cart.id]);
  for (const line of active) {
   line.reserved = true;
   await connection.query("INSERT INTO carrito_reservas (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)", [cart.id, line.productId, line.quantity]);
  }
  const delivery = json<OrderDelivery>(cart.entrega);
  const orderId = randomUUID();
  await connection.query("INSERT INTO pedidos (id, usuario_id, carrito_id, clave_confirmacion, estado, productos, entrega, ajustes, total_estimado, total_confirmado) VALUES (?, ?, ?, ?, 'esperando_pago', ?, ?, ?, ?, ?)", [orderId, userId, cart.id, cart.id, JSON.stringify(lines), JSON.stringify(delivery), JSON.stringify(adjustments), subtotal, totalCents / 100]);
  // The confirmed cart remains as the order snapshot and reservation owner. Free the account slot for future purchases.
  await connection.query("UPDATE carritos SET estado = 'confirmado', pedido_id = ?, usuario_id = NULL, productos_confirmados = ?, version = version + 1, ultima_actividad = NOW() WHERE id = ?", [orderId, JSON.stringify(lines), cart.id]);
  await notifyOrderAccepted(connection, { cartId: String(cart.id), orderId, userId, version: Number(cart.version) + 1, products: active.length, units: active.reduce((sum, line) => sum + line.quantity, 0), total: totalCents / 100 });
  await connection.commit(); return { status: "confirmado", orderId };
 } catch (error) { await connection.rollback(); throw error; }
 finally { connection.release(); }
}
