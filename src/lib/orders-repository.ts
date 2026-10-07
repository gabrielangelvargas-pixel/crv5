import { snapshotOrderLines, readOrderLines, orderCostSubtotal, type StoredOrderLine } from "./order-detail";
import { resolveOrderAddress } from "./order-address";
import type { CartAdjustment } from "./cart-adjustments";
import { nextOrderNumber } from "./order-number";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDatabasePool } from "./db";
import type { CartItem } from "./cart";

export type OrderDelivery = { method: "retiro" | "envio"; phone: string; address: string; notes: string; addressId?: string | null | undefined };
export type OrderLine = { costPrice?: number; costSubtotal?: number; description?: string; reserved?: boolean; exhausted?: boolean; productId: string; code: string; name: string; variant: string | null; quantity: number; unitPrice: number; subtotal: number };
export type Order = { costSubtotal?: number; costTotal?: number; adjustments?: CartAdjustment[]; id: string; number?: string; customer: string; status: string; lines: OrderLine[]; delivery: OrderDelivery; estimatedTotal: number; confirmedTotal: number | null; created: string };
export class OrderError extends Error { }
export async function updateOrder(id: string, original: OrderLine[], items: CartItem[]) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>("SELECT estado, productos FROM pedidos WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0] || rows[0].estado !== "pendiente_revision") throw new OrderError("Solo se pueden editar pedidos pendientes de revisión.");
    const fingerprint = (lines: OrderLine[]) => JSON.stringify(lines.map(l => [l.productId, l.code, l.name, l.variant, l.quantity, l.unitPrice, l.subtotal]));
    if (fingerprint(readOrderLines(parseJSON<StoredOrderLine[]>(rows[0].productos), false)) !== fingerprint(original)) throw new OrderError("El pedido cambió. Actualizá la página antes de editarlo.");
    if (!items.length || items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) throw new OrderError("El pedido debe tener al menos un producto con cantidad válida. Para dejarlo vacío, cancelalo.");
    const ids = items.map(i => i.productId);
    const [products] = await connection.query<RowDataPacket[]>("SELECT p.* FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.id IN (?) AND p.activo = 1 AND c.activa = 1 ORDER BY p.id FOR UPDATE", [ids]);
    const [tiers] = await connection.query<RowDataPacket[]>("SELECT producto_id, cantidad_minima, precio_unitario FROM producto_precios WHERE producto_id IN (?) AND activo = 1", [ids]);
    const lines = items.map((item): OrderLine => {
      const p = products.find(p => String(p.id) === item.productId);
      if (!p || Number(p.stock) < item.quantity) throw new OrderError("Stock insuficiente o producto no disponible. Revisá las cantidades.");
      const cents = Math.min(...[Number(p.precio_venta), Number(p.precio_oferta ?? p.precio_venta), ...tiers.filter(t => String(t.producto_id) === item.productId && Number(t.cantidad_minima) <= item.quantity).map(t => Number(t.precio_unitario))].map(v => Math.round(v * 100)));
      return { productId: item.productId, code: String(p.codigo), name: String(p.nombre), variant: p.variante === null ? null : String(p.variante), quantity: item.quantity, unitPrice: cents / 100, subtotal: cents * item.quantity / 100 };
    });
    const total = lines.reduce((s, l) => s + Math.round(l.subtotal * 100), 0) / 100;
    const detail = await snapshotOrderLines(connection, lines);
    const cost = orderCostSubtotal(detail);
    await connection.query("UPDATE pedidos SET productos = ?, subtotal_venta = ?, subtotal_costo = ?, total_venta = NULL, total_costo = ?, actualizado = CURRENT_TIMESTAMP WHERE id = ?", [JSON.stringify(detail), total, cost, cost, id]);
    await connection.commit();
    return { lines, total };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
const parseJSON = <T>(value: string | T): T => typeof value === "string" ? JSON.parse(value) : value;

export async function createOrder(userId: string, input: { key: string; version: number; expectedTotalCents: number; delivery: OrderDelivery }) {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", [userId]);
    const [existing] = await connection.query<RowDataPacket[]>("SELECT id FROM pedidos WHERE usuario_id = ? AND clave_confirmacion = ?", [userId, input.key]);
    if (existing[0]) { await connection.commit(); return String(existing[0].id); }
    const [carts] = await connection.query<RowDataPacket[]>("SELECT id, items, version FROM carritos WHERE usuario_id = ? AND estado = 'activo' FOR UPDATE", [userId]);
    const cart = carts[0];
    if (!cart) throw new OrderError("Tu carrito está vacío o ya se convirtió en un pedido.");
    if (Number(cart.version) !== input.version) throw new OrderError("El carrito cambió. Revisá las cantidades antes de confirmar.");
    const items = parseJSON<CartItem[]>(cart.items);
    if (!items.length || items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) throw new OrderError("Agregá productos antes de confirmar el pedido.");
    const ids = items.map((item) => item.productId);
    const [products] = await connection.query<RowDataPacket[]>("SELECT p.id, p.codigo, p.nombre, p.variante, p.precio_venta, p.precio_oferta, p.stock FROM productos p JOIN categorias c ON c.id = p.categoria_id WHERE p.id IN (?) AND p.activo = 1 AND c.activa = 1 ORDER BY p.id FOR UPDATE", [ids]);
    const [tiers] = await connection.query<RowDataPacket[]>("SELECT producto_id, cantidad_minima, precio_unitario FROM producto_precios WHERE producto_id IN (?) AND activo = 1", [ids]);
    const lines: OrderLine[] = items.map((item) => {
      const product = products.find((row) => String(row.id) === item.productId);
      if (!product || Number(product.stock) < item.quantity) throw new OrderError("Cambió la disponibilidad de un producto. Revisá el carrito antes de confirmar.");
      const prices = [Number(product.precio_venta), product.precio_oferta === null ? Number(product.precio_venta) : Number(product.precio_oferta), ...tiers.filter((tier) => String(tier.producto_id) === item.productId && Number(tier.cantidad_minima) <= item.quantity).map((tier) => Number(tier.precio_unitario))];
      const cents = Math.min(...prices.map((price) => Math.round(price * 100)));
      return { productId: item.productId, code: String(product.codigo), name: String(product.nombre), variant: product.variante === null ? null : String(product.variante), quantity: item.quantity, unitPrice: cents / 100, subtotal: cents * item.quantity / 100 };
    });
    const totalCents = lines.reduce((sum, line) => sum + Math.round(line.subtotal * 100), 0);
    if (totalCents !== input.expectedTotalCents) throw new OrderError("Los precios cambiaron. Actualizá la página y revisá el importe estimado.");
    const detail = await snapshotOrderLines(connection, lines);
    const cost = orderCostSubtotal(detail);
    const addressId = await resolveOrderAddress(connection, userId, input.delivery);
    const id = randomUUID();
    const number = await nextOrderNumber(connection);
    await connection.query("INSERT INTO pedidos (id, numero, usuario_id, carrito_id, clave_confirmacion, productos, entrega, modalidad_entrega, telefono_entrega, observaciones_entrega, subtotal_venta, subtotal_costo, total_costo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, number, userId, cart.id, input.key, JSON.stringify(detail), addressId, input.delivery.method, input.delivery.phone, input.delivery.notes, totalCents / 100, cost, cost]);
    // Keep a snapshot of the converted cart; free the unique user slot for future orders.
    await connection.query("UPDATE carritos SET estado = 'convertido', usuario_id = NULL, token_hash = NULL, version = version + 1 WHERE id = ?", [cart.id]);
    await connection.commit();
    return id;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function getOrders(userId?: string) {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>(`SELECT p.*, u.nombre, d.direccion, d.localidad, d.provincia FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id LEFT JOIN usuarios_direcciones d ON d.id = p.entrega ${userId ? "WHERE p.usuario_id = ?" : ""} ORDER BY p.creado DESC LIMIT 200`, userId ? [userId] : []);
  return rows.map((row): Order => ({ adjustments: parseJSON(row.ajustes ?? []), id: String(row.id), number: String(row.numero), customer: String(row.nombre), status: String(row.estado), lines: readOrderLines(parseJSON<StoredOrderLine[]>(row.productos), !userId), delivery: { method: row.modalidad_entrega, phone: String(row.telefono_entrega), notes: String(row.observaciones_entrega ?? ""), addressId: row.entrega == null ? null : String(row.entrega), address: row.entrega == null ? "" : `${row.direccion}, ${row.localidad}, ${row.provincia}` }, estimatedTotal: Number(row.subtotal_venta), confirmedTotal: row.total_venta === null ? null : Number(row.total_venta), ...(!userId ? { costSubtotal: Number(row.subtotal_costo), costTotal: Number(row.total_costo) } : {}), created: new Date(row.creado).toISOString() }));
}

export async function getOrderContact(userId: string) {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>("SELECT id, telefono, direccion, localidad, provincia FROM usuarios_direcciones WHERE id_usuario = ? AND activa = 1 ORDER BY predeterminada DESC, id", [userId]);
  const row = rows[0];
  return { phone: row ? String(row.telefono) : "", address: row ? `${row.direccion}, ${row.localidad}, ${row.provincia}` : "", addresses: rows.map(address => ({ id: String(address.id), label: `${address.direccion}, ${address.localidad}, ${address.provincia}` })) };
}
