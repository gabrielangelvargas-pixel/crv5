import { beforeEach, expect, it, vi } from "vitest";
import { createOrder, getOrders } from "./orders-repository";
const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db, query: db.query }) }));
const input = { key: "key", version: 2, expectedTotalCents: 21000, delivery: { method: "retiro" as const, phone: "123456", address: "", notes: "" } };
beforeEach(() => {
  vi.clearAllMocks();
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM pedido_numeracion")) return [[{ ultimo_numero: 0 }]];
    if (sql.startsWith("SELECT id FROM pedidos")) return [[]];
    if (sql.includes("FROM carritos")) return [[{ id: "cart", items: [{ productId: "1", quantity: 3 }], version: 2 }]];
    if (sql.includes("FROM productos")) return [[{ id: 1, codigo: "A", nombre: "Aro", variante: null, precio_costo: 25, precio_venta: 100, precio_oferta: 80, stock: 5 }]];
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

it("asigna el correlativo dentro de la transacción", async () => {
  await createOrder("7", input);
  expect(db.query).toHaveBeenCalledWith("UPDATE pedido_numeracion SET ultimo_numero = ? WHERE id = 1", ["1"]);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO pedidos"), expect.arrayContaining(["1"]));
});

it("oculta costos al cliente y conserva los importes administrativos", async () => {
 db.query.mockResolvedValue([[{ id: "order", numero: 1, nombre: "Cliente", estado: "esperando_pago", productos: [{ producto_id: "1", codigo: "A", variante: null, descripcion: "Aro", nombre: "Aro", cantidad: 2, precio_costo: 25, precio_venta: 100, subtotal_costo: 50, subtotal_venta: 200 }], modalidad_entrega: "retiro", telefono_entrega: "123456", observaciones_entrega: "", entrega: null, ajustes: [], subtotal_venta: 200, subtotal_costo: 50, total_venta: 210, total_costo: 50, creado: new Date("2026-10-02T12:00:00Z") }]]);
 const customer = (await getOrders("7"))[0]!;
 expect(customer.lines[0]).not.toHaveProperty("costPrice");
 expect(customer).not.toHaveProperty("costTotal");
 expect(customer.estimatedTotal).toBe(200);
 expect(customer.confirmedTotal).toBe(210);
 const admin = (await getOrders())[0]!;
 expect(admin.lines[0]).toMatchObject({ costPrice: 25, costSubtotal: 50 });
 expect(admin.costTotal).toBe(50);
});
