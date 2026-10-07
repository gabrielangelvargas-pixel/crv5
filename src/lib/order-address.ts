import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import type { OrderDelivery } from "./orders-repository";
import { OrderError } from "./orders-repository";

export async function resolveOrderAddress(connection: PoolConnection, userId: string, delivery: OrderDelivery): Promise<string | null> {
  if (delivery.method === "retiro") return null;
  if (!delivery.addressId) throw new OrderError("Elegí una dirección guardada para el envío.");
  const [rows] = await connection.query<RowDataPacket[]>("SELECT id, direccion, localidad, provincia FROM usuarios_direcciones WHERE id = ? AND id_usuario = ? AND activa = 1 FOR UPDATE", [delivery.addressId, userId]);
  if (!rows[0]) throw new OrderError("La dirección de entrega no está disponible para tu cuenta.");
  delivery.address = `${rows[0].direccion}, ${rows[0].localidad}, ${rows[0].provincia}`;
  return String(rows[0].id);
}
