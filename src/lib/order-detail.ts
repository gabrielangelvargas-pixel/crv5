import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import type { OrderLine } from "./orders-repository";

export type StoredOrderLine = {
  producto_id: string; codigo: string; variante: string | null; descripcion: string; nombre: string;
  cantidad: number; precio_costo: number; precio_venta: number; subtotal_costo: number; subtotal_venta: number;
};
export async function snapshotOrderLines(connection: PoolConnection, lines: OrderLine[]): Promise<StoredOrderLine[]> {
  const active = lines.filter(line => !line.exhausted);
  const [products] = await connection.query<RowDataPacket[]>("SELECT id, descripcion, precio_costo FROM productos WHERE id IN (?) ORDER BY id FOR UPDATE", [active.map(line => line.productId)]);
  return active.map(line => {
    const product = products.find(p => String(p.id) === line.productId);
    if (!product) throw new Error("No se pudo obtener el costo de un producto del pedido.");
    const cents = product.precio_costo == null ? NaN : Math.round(Number(product.precio_costo) * 100);
    const subtotalCents = cents * line.quantity;
    if (!Number.isSafeInteger(cents) || cents < 0 || !Number.isSafeInteger(line.quantity) || line.quantity <= 0 || !Number.isSafeInteger(subtotalCents) || subtotalCents > 99999999999999) throw new Error("El costo del producto no es válido o supera el límite permitido.");
    return { producto_id: line.productId, codigo: line.code, variante: line.variant, descripcion: String(product.descripcion ?? line.name), nombre: line.name, cantidad: line.quantity, precio_costo: cents / 100, precio_venta: line.unitPrice, subtotal_costo: subtotalCents / 100, subtotal_venta: line.subtotal };
  });
}
export function readOrderLines(lines: StoredOrderLine[], includeCosts: boolean): OrderLine[] {
  return lines.map(line => ({ productId: line.producto_id, code: line.codigo, variant: line.variante, name: line.nombre ?? line.descripcion, quantity: line.cantidad, unitPrice: line.precio_venta, subtotal: line.subtotal_venta, ...(includeCosts ? { costPrice: line.precio_costo, costSubtotal: line.subtotal_costo, description: line.descripcion } : {}) }));
}
export function orderCostSubtotal(lines: StoredOrderLine[]): number {
  const cents = lines.reduce((sum, line) => sum + Math.round(line.subtotal_costo * 100), 0);
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 99999999999999) throw new Error("El subtotal de costo supera el límite permitido.");
  return cents / 100;
}

