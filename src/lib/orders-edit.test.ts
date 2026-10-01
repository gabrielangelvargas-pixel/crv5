import { beforeEach, expect, it, vi } from "vitest";
import { updateOrder } from "./orders-repository";
const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db }) }));
const original = [{ productId: "1", code: "A", name: "Aro", variant: null, quantity: 1, unitPrice: 100, subtotal: 100 }];
let status: string;
beforeEach(() => {
  vi.clearAllMocks(); status = "pendiente_revision";
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM pedidos")) return [[{ estado: status, productos: original }]];
    if (sql.includes("FROM productos")) return [[{ id: 1, codigo: "A", nombre: "Aro", variante: null, precio_venta: 100, precio_oferta: 80, stock: 5 }, { id: 2, codigo: "B", nombre: "Bolso", variante: "Azul", precio_venta: 200, precio_oferta: null, stock: 10 }]];
    if (sql.includes("FROM producto_precios")) return [[{ producto_id: 1, cantidad_minima: 3, precio_unitario: 70 }]];
    return [{}];
  });
});
it("modifica cantidad y agrega una variante con el menor precio sin descontar stock", async () => {
  const result = await updateOrder("order", original, [{ productId: "1", quantity: 3 }, { productId: "2", quantity: 2 }]);
  expect(result.total).toBe(610);
  expect(result.lines[0]?.unitPrice).toBe(70);
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE productos"))).toBe(false);
  expect(db.commit).toHaveBeenCalledOnce();
});
it("elimina una línea del pedido", async () => {
  const result = await updateOrder("order", original, [{ productId: "2", quantity: 1 }]);
  expect(result.lines.map(l => l.productId)).toEqual(["2"]);
});
it("impide editar pedidos cerrados", async () => {
  status = "cerrado";
  await expect(updateOrder("order", original, [{ productId: "1", quantity: 2 }])).rejects.toThrow("pendientes");
  expect(db.rollback).toHaveBeenCalledOnce();
});
it("impide sobrescribir otra edición", async () => {
  await expect(updateOrder("order", [], [{ productId: "1", quantity: 2 }])).rejects.toThrow("cambió");
});
it("revierte el pedido completo si falta stock", async () => {
  await expect(updateOrder("order", original, [{ productId: "1", quantity: 6 }])).rejects.toThrow("Stock");
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
  expect(db.rollback).toHaveBeenCalledOnce();
});