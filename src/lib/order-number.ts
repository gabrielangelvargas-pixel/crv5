import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

// Call inside the order transaction, after validation. Rollback restores the counter.
export async function nextOrderNumber(connection: PoolConnection): Promise<string> {
  const [rows] = await connection.query<RowDataPacket[]>("SELECT ultimo_numero FROM pedido_numeracion WHERE id = 1 FOR UPDATE");
  if (!rows[0]) throw new Error("Aplicá la migración de numeración de pedidos antes de confirmar.");
  const number = (BigInt(String(rows[0].ultimo_numero)) + 1n).toString();
  await connection.query("UPDATE pedido_numeracion SET ultimo_numero = ? WHERE id = 1", [number]);
  return number;
}
