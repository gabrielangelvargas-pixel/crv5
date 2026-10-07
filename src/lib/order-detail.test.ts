import { expect, it, vi } from "vitest";
import type { PoolConnection } from "mysql2/promise";
import { snapshotOrderLines, readOrderLines, orderCostSubtotal } from "./order-detail";
const lines = [{ productId: "1", code: "A", name: "Aro", variant: "Azul", quantity: 3, unitPrice: 70, subtotal: 210 }];
it("guarda el costo del catálogo y el precio de venta revisado en el JSON", async () => {
 const connection = { query: vi.fn().mockResolvedValue([[{ id: 1, descripcion: "Aro de acero", precio_costo: "25.15" }]]) } as unknown as PoolConnection;
 const detail = await snapshotOrderLines(connection, [...lines, { ...lines[0]!, productId: "2", exhausted: true }]);
 expect(detail).toEqual([{ producto_id: "1", codigo: "A", nombre: "Aro", variante: "Azul", descripcion: "Aro de acero", cantidad: 3, precio_costo: 25.15, precio_venta: 70, subtotal_costo: 75.45, subtotal_venta: 210 }]);
 expect(orderCostSubtotal(detail)).toBe(75.45);
 expect(readOrderLines(detail, false)[0]).not.toHaveProperty("costPrice");
 expect(readOrderLines(detail, true)[0]).toMatchObject({ costPrice: 25.15, costSubtotal: 75.45 });
});
it("rechaza costos inválidos y productos faltantes", async () => {
 for (const products of [[], [{ id: 1, precio_costo: -1 }], [{ id: 1, precio_costo: null }]]) {
  const connection = { query: vi.fn().mockResolvedValue([products]) } as unknown as PoolConnection;
  await expect(snapshotOrderLines(connection, lines)).rejects.toThrow();
 }
});

it("rechaza un subtotal de costo que excede el campo decimal", async () => {
 const connection = { query: vi.fn().mockResolvedValue([[{ id: 1, precio_costo: "9999999999.99" }]]) } as unknown as PoolConnection;
 await expect(snapshotOrderLines(connection, [{ ...lines[0]!, quantity: 1000000 }])).rejects.toThrow("límite");
});
