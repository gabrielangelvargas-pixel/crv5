import { beforeEach, expect, it, vi } from "vitest";
import { createOrder } from "./orders-repository";
const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db }) }));
const input = { key: "key", version: 2, expectedTotalCents: 21000, delivery: { method: "retiro" as const, phone: "123456", address: "", notes: "" } };
beforeEach(() => {
  vi.clearAllMocks();
  db.query.mockImplementation(async (sql: string) => {
    if (sql.startsWith("SELECT id FROM pedidos")) return [[]];
    if (sql.includes("FROM carritos")) return [[{ id: "cart", items: [{ productId: "1", quantity: 3 }], version: 2 }]];
    if (sql.includes("FROM productos")) return [[{ id: 1, codigo: "A", nombre: "Aro", variante: null, precio_venta: 100, precio_oferta: 80, stock: 5 }]];
    if (sql.includes("FROM producto_precios")) return [[{ producto_id: 1, cantidad_minima: 3, precio_unitario: 70 }]];
    return [{}];
  });
});
it("crea un pedido con el menor precio, convierte el carrito y no descuenta stock", async () => {
  const id = await createOrder("7", input);
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO pedidos"), expect.arrayContaining([id, "7", "cart", "key", 210]));
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining("estado = 'convertido'"), ["cart"]);
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE productos"))).toBe(false);
  expect(db.commit).toHaveBeenCalledOnce();
});
it("no crea otra copia al reintentar una confirmación ya guardada", async () => {
  db.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ id: "original" }]]);
  expect(await createOrder("7", input)).toBe("original");
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT"))).toBe(false);
});
it("rechaza cambios de precio y revierte la transacción", async () => {
  await expect(createOrder("7", { ...input, expectedTotalCents: 1 })).rejects.toThrow("precios cambiaron");
  expect(db.rollback).toHaveBeenCalledOnce();
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT"))).toBe(false);
});
it("rechaza stock insuficiente sin convertir el carrito", async () => {
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM carritos")) return [[{ id: "cart", items: [{ productId: "1", quantity: 8 }], version: 2 }]];
    if (sql.includes("FROM productos")) return [[{ id: 1, stock: 5 }]];
    return [[]];
  });
  await expect(createOrder("7", input)).rejects.toThrow("disponibilidad");
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
});
