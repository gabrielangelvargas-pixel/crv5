import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { getDatabasePool } from "./db";
import type { AuthUser } from "@/data/auth";
import { hasRole } from "./authorization";

export const canReceiveCartNotifications = (user: AuthUser) => hasRole(user, "admin", "administrador", "vendedor");
export type CartNotification = { kind?: "revision" | "actualizacion" | "pedido"; orderId?: string | null; id: string; cartId: string; customer: string; products: number; units: number; total: number; created: string; read: boolean };

// Called in the confirmation transaction: no notification survives a failed submission.
export async function notifyCartSubmitted(connection: PoolConnection, input: { cartId: string; userId: string; version: number; products: number; units: number; total: number }) {
  await connection.query(`INSERT INTO notificaciones_carritos (usuario_id, carrito_id, version, cliente, productos, unidades, total_estimado)
    SELECT DISTINCT u.id, ?, ?, cliente.nombre, ?, ?, ?
    FROM usuarios u JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = 1
    JOIN roles r ON r.id = ur.id_rol AND r.activo = 1
    JOIN usuarios cliente ON cliente.id = ?
    WHERE u.activo = 1 AND LOWER(r.codigo) IN ('admin','administrador','vendedor')`,
  [input.cartId, input.version, input.products, input.units, input.total, input.userId]);
}

export async function notifyCartReviewed(connection: PoolConnection, input: { cartId: string; userId: string; version: number; products: number; units: number; total: number }) {
  await connection.query(`INSERT INTO notificaciones_carritos (usuario_id, carrito_id, version, tipo, cliente, productos, unidades, total_estimado)
    SELECT id, ?, ?, 'actualizacion', nombre, ?, ?, ? FROM usuarios WHERE id = ? AND activo = 1`, [input.cartId, input.version, input.products, input.units, input.total, input.userId]);
}
export async function notifyOrderAccepted(connection: PoolConnection, input: { cartId: string; orderId: string; userId: string; version: number; products: number; units: number; total: number }) {
  await connection.query(`INSERT INTO notificaciones_carritos (usuario_id, carrito_id, version, tipo, pedido_id, cliente, productos, unidades, total_estimado)
    SELECT DISTINCT u.id, ?, ?, 'pedido', ?, cliente.nombre, ?, ?, ?
    FROM usuarios u JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = 1
    JOIN roles r ON r.id = ur.id_rol AND r.activo = 1 JOIN usuarios cliente ON cliente.id = ?
    WHERE u.activo = 1 AND LOWER(r.codigo) IN ('admin','administrador','vendedor')`, [input.cartId, input.version, input.orderId, input.products, input.units, input.total, input.userId]);
}

export async function getCartNotifications(userId: string) {
  const pool = getDatabasePool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM notificaciones_carritos WHERE usuario_id = ? ORDER BY creado DESC, id DESC LIMIT 50", [userId]);
  const [counts] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS cantidad FROM notificaciones_carritos WHERE usuario_id = ? AND leido_en IS NULL", [userId]);
  return { unread: Number(counts[0]?.cantidad ?? 0), notifications: rows.map((row): CartNotification => ({ kind: row.tipo ?? "revision", orderId: row.pedido_id ? String(row.pedido_id) : null, id: String(row.id), cartId: String(row.carrito_id), customer: String(row.cliente), products: Number(row.productos), units: Number(row.unidades), total: Number(row.total_estimado), created: new Date(row.creado).toISOString(), read: row.leido_en !== null })) };
}

export async function readCartNotification(userId: string, id?: string) {
  await getDatabasePool().query(`UPDATE notificaciones_carritos SET leido_en = NOW() WHERE usuario_id = ? AND leido_en IS NULL${id ? " AND id = ?" : ""}`, id ? [userId, id] : [userId]);
}
