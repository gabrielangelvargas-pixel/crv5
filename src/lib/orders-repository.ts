import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getDatabasePool } from "./db";
import type { CartItem } from "./cart";

export type OrderDelivery = { method: "retiro" | "envio"; phone: string; address: string; notes: string };
export type OrderLine = { productId: string; code: string; name: string; variant: string | null; quantity: number; unitPrice: number; subtotal: number };
export type Order = { id: string; customer: string; status: string; lines: OrderLine[]; delivery: OrderDelivery; estimatedTotal: number; confirmedTotal: number | null; created: string };
export class OrderError extends Error { }
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
    if (!items.length) throw new OrderError("Agregá productos antes de confirmar el pedido.");
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
    const id = randomUUID();
    await connection.query("INSERT INTO pedidos (id, usuario_id, carrito_id, clave_confirmacion, productos, entrega, total_estimado) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, userId, cart.id, input.key, JSON.stringify(lines), JSON.stringify(input.delivery), totalCents / 100]);
    // Keep a snapshot of the converted cart; free the unique user slot for future orders.
    await connection.query("UPDATE carritos SET estado = 'convertido', usuario_id = NULL, token_hash = NULL, version = version + 1 WHERE id = ?", [cart.id]);
    await connection.commit();
    return id;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function getOrders(userId?: string) {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>(`SELECT p.*, u.nombre FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id ${userId ? "WHERE p.usuario_id = ?" : ""} ORDER BY p.creado DESC LIMIT 200`, userId ? [userId] : []);
  return rows.map((row): Order => ({ id: String(row.id), customer: String(row.nombre), status: String(row.estado), lines: parseJSON(row.productos), delivery: parseJSON(row.entrega), estimatedTotal: Number(row.total_estimado), confirmedTotal: row.total_confirmado === null ? null : Number(row.total_confirmado), created: new Date(row.creado).toISOString() }));
}

export async function getOrderContact(userId: string) {
  const [rows] = await getDatabasePool().query<RowDataPacket[]>("SELECT telefono, direccion, localidad, provincia FROM usuarios_direcciones WHERE id_usuario = ? AND activa = 1 ORDER BY predeterminada DESC, id LIMIT 1", [userId]);
  const row = rows[0];
  return row ? { phone: String(row.telefono), address: `${row.direccion}, ${row.localidad}, ${row.provincia}` } : { phone: "", address: "" };
}
