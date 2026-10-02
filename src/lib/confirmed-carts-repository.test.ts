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
 await expect(updateConfirmedCart("cart", { version: 2, items: [{ productId: "1", quantity: 6, reserved: true }] })).rejects.toThrow("Stock");
});
it("no permite que la confirmación inicial acepte cambios administrativos", async () => {
 state = "actualizado";
 await expect(confirmCart("7", input)).rejects.toThrow("Confirmar & Pagar");
});
it("rechaza precios diferentes y carritos vacíos", async () => {
 await expect(confirmCart("7", { ...input, expectedTotalCents: 1 })).rejects.toThrow("precios cambiaron");
 state = "confirmado";
 await expect(updateConfirmedCart("cart", { version: 1, items: [] })).rejects.toThrow("al menos");
});

it("permite dejar productos pendientes por encima del stock, conservando la marca booleana", async () => {
 state = "confirmado";
 const result = await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 6, reserved: false }] });
 expect(result.lines[0]?.reserved).toBe(false);
 expect(result.lines[0]?.quantity).toBe(6);
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE productos"))).toBe(false);
});
it("guarda reservado verdadero en el detalle, sin alterar el stock ni los items del cliente", async () => {
 state = "confirmado";
 const result = await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 2, reserved: true }] });
 expect(result.lines[0]?.reserved).toBe(true);
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE carritos SET items"), expect.arrayContaining([JSON.stringify([{ productId: "1", quantity: 2 }])]));
});

it("crea el bloqueo de unidades al marcar reservado y lo libera al dejar pendiente", async () => {
 state = "confirmado";
 await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 2, reserved: true }] });
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO carrito_reservas"), ["cart", "1", 2]);
 db.query.mockClear();
 await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 2, reserved: false }] });
 expect(db.query).toHaveBeenCalledWith("DELETE FROM carrito_reservas WHERE carrito_id = ?", ["cart"]);
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT INTO carrito_reservas"))).toBe(false);
});
it("no reserva unidades bloqueadas por otro cliente", async () => {
 state = "confirmado";
 const original = db.query.getMockImplementation()!;
 db.query.mockImplementation(async (sql: string, args: unknown[]) => sql.includes("SELECT producto_id, cantidad FROM carrito_reservas") ? [[{ producto_id: 1, cantidad: 4 }]] : original(sql, args));
 await expect(updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 2, reserved: true }] })).rejects.toThrow("Stock");
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT INTO carrito_reservas"))).toBe(false);
});

it("notifica cada envío nuevo pero no duplica avisos en un reintento", async () => {
 await confirmCart("7", input);
 expect(db.query.mock.calls.filter(([sql]) => sql.includes("INSERT INTO notificaciones_carritos"))).toHaveLength(1);
 db.query.mockClear(); state = "confirmado"; version = 2;
 await confirmCart("7", input);
 expect(db.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO notificaciones_carritos"))).toBe(false);
});

it("persiste agotado en el historial pero lo excluye de items, total y reservas", async () => {
 state = "confirmado";
 const result = await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 6, reserved: true, exhausted: true }] });
 expect(result.total).toBe(0);
 expect(result.lines[0]).toMatchObject({ exhausted: true, reserved: false, quantity: 6, subtotal: 0 });
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE carritos SET items"), expect.arrayContaining(["[]", JSON.stringify(result.lines), 0, "cart"]));
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT INTO carrito_reservas"))).toBe(false);
});

it("guarda varios ajustes con centavos sin cambiar el subtotal de productos", async () => {
 state = "confirmado";
 const adjustments = [{ description: "Redondeo", amountCents: -510 }, { description: "Envío", amountCents: 112000 }];
 const result = await updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 3 }], adjustments });
 expect(result.total).toBe(210);
 expect(result.payableTotal).toBe(1324.9);
 expect(result.adjustments).toEqual(adjustments);
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("ajustes = ?"), expect.arrayContaining([JSON.stringify(adjustments)]));
});
it("rechaza ajustes inválidos y un total negativo antes de tocar reservas", async () => {
 state = "confirmado";
 for (const adjustment of [{ description: "Descuento", amountCents: -100000 }, { description: "", amountCents: 100 }, { description: "Envío", amountCents: 1.5 }]) {
  await expect(updateConfirmedCart("cart", { version: 1, items: [{ productId: "1", quantity: 1 }], adjustments: [adjustment] })).rejects.toThrow();
 }
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("DELETE FROM carrito_reservas"))).toBe(false);
});
