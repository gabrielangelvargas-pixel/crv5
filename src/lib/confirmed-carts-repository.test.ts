import { beforeEach, expect, it, vi } from "vitest";
import { confirmCart, updateConfirmedCart } from "./confirmed-carts-repository";
const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db }) }));
let state: string; let version: number;
const input = { version: 1, expectedTotalCents: 21000, delivery: { method: "retiro" as const, phone: "123456", address: "", notes: "" } };
beforeEach(() => {
 vi.clearAllMocks(); state = "activo"; version = 1;
 db.query.mockImplementation(async (sql: string) => {
  if (sql.includes("FROM carritos")) return [[{ id: "cart", estado: state, version, items: [{ productId: "1", quantity: 3 }] }]];
  if (sql.includes("FROM productos")) return [[{ id: 1, codigo: "A", nombre: "Aro", variante: null, precio_venta: 100, precio_oferta: 80, stock: 5 }]];
  if (sql.includes("FROM producto_precios")) return [[{ producto_id: 1, cantidad_minima: 3, precio_unitario: 70 }]];
  return [[]];
 });
});
it("mantiene el carrito y su propietario al confirmar sin crear pedidos ni descontar stock", async () => {
 expect(await confirmCart("7", input)).toEqual({ id: "cart", version: 2 });
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("estado = 'confirmado'"), expect.arrayContaining([210, "cart"]));
 expect(db.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO pedidos") || sql.includes("UPDATE productos") || sql.includes("usuario_id = NULL"))).toBe(false);
});
it("reintentar una confirmación no vuelve a modificarlo", async () => {
 state = "confirmado"; version = 2;
 await confirmCart("7", input);
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
});
it("actualiza cantidades con precio por variante y deja pendiente la aceptación", async () => {
 state = "confirmado";
 const result = await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 4 }] });
 expect(result.total).toBe(280);
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("estado = 'actualizado'"), expect.arrayContaining([280, "cart"]));
});
it("rechaza versiones anteriores y falta de stock", async () => {
 state = "actualizado"; version = 2;
 await expect(updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 2 }] })).rejects.toThrow("cambió");
 await expect(updateConfirmedCart("cart", { version: 2, items: [{ productId: "1", quantity: 6 }] })).rejects.toThrow("Stock");
});
it("no permite que la confirmación inicial acepte cambios administrativos", async () => {
 state = "actualizado";
 await expect(confirmCart("7", input)).rejects.toThrow("próximo paso");
});
it("rechaza precios diferentes y carritos vacíos", async () => {
 await expect(confirmCart("7", { ...input, expectedTotalCents: 1 })).rejects.toThrow("precios cambiaron");
 state = "confirmado";
 await expect(updateConfirmedCart("cart", { version: 1, items: [] })).rejects.toThrow("al menos");
});
