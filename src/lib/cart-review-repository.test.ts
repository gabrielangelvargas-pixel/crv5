import { beforeEach, expect, it, vi } from "vitest";
import { respondToCartReview } from "./cart-review-repository";
const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db }) }));
let cart: Record<string, unknown>;
beforeEach(() => {
 vi.clearAllMocks();
 cart = { id: "cart", usuario_id: "7", estado: "actualizado", version: 2, entrega: { method: "retiro", phone: "1111111", address: "", notes: "" }, ajustes: [{ description: "Envío", amountCents: 112000 }, { description: "Redondeo", amountCents: -510 }], productos_confirmados: [{ productId: "1", quantity: 2, code: "A", name: "Aro", variant: null, unitPrice: 100, subtotal: 200 }, { productId: "2", quantity: 1, exhausted: true, subtotal: 0 }] };
 db.query.mockImplementation(async (sql: string) => {
  if (sql.includes("FROM pedido_numeracion")) return [[{ ultimo_numero: 0 }]];
  if (sql.includes("FROM carritos")) return [[cart]];
  if (sql.includes("SELECT p.id, p.stock")) return [[{ id: 1, stock: 5 }]];
  if (sql.includes("FROM productos")) return [[{ id: 1, descripcion: "Aro de acero", precio_costo: 25 }]];
  if (sql.includes("FROM pedidos")) return [[{ id: "order" }]];
  return [[]];
 });
});
const input = { cartId: "cart", action: "accept" as const, version: 2, expectedTotalCents: 131490 };
it("genera un pedido esperando pago con el precio revisado, ajustes y reserva sin descontar stock", async () => {
 const result = await respondToCartReview("7", input);
 expect(result.status).toBe("confirmado");
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO pedidos"), expect.arrayContaining([200, 1314.9, JSON.stringify(cart.ajustes)]));
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO carrito_reservas"), ["cart", "1", 2]);
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE productos"))).toBe(false);
 expect(db.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO notificaciones_carritos") && sql.includes("'pedido'"))).toBe(true);
});
it("un reintento devuelve el mismo pedido sin duplicar reservas ni notificaciones", async () => {
 cart.pedido_id = "order"; cart.usuario_id = null;
 expect(await respondToCartReview("7", input)).toEqual({ status: "confirmado", orderId: "order" });
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT") || sql.startsWith("UPDATE"))).toBe(false);
});
it("volver a comprar activa el carrito y libera reservas, conservando agotados", async () => {
 const result = await respondToCartReview("7", { ...input, action: "continue" });
 expect(result.status).toBe("activo");
 expect(db.query).toHaveBeenCalledWith("DELETE FROM carrito_reservas WHERE carrito_id = ?", ["cart"]);
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("estado = 'activo'"), [JSON.stringify([{ productId: "2", quantity: 1, exhausted: true, subtotal: 0 }]), "cart"]);
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT INTO pedidos"))).toBe(false);
});
it("rechaza carritos ajenos, versiones e importes obsoletos", async () => {
 await expect(respondToCartReview("8", input)).rejects.toThrow("cuenta");
 await expect(respondToCartReview("7", { ...input, version: 1 })).rejects.toThrow("cambió");
 await expect(respondToCartReview("7", { ...input, expectedTotalCents: 1 })).rejects.toThrow("importe");
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT"))).toBe(false);
});
it("no genera un pedido antes de la revisión ni cuando falta stock o todos están agotados", async () => {
 cart.estado = "confirmado";
 await expect(respondToCartReview("7", input)).rejects.toThrow("revisar");
 cart.estado = "actualizado";
 const original = db.query.getMockImplementation()!;
 db.query.mockImplementation(async (sql: string) => sql.includes("SELECT p.id, p.stock") ? [[{ id: 1, stock: 1 }]] : original(sql));
 await expect(respondToCartReview("7", input)).rejects.toThrow("disponibilidad");
 cart.productos_confirmados = [{ productId: "1", quantity: 2, exhausted: true, subtotal: 0 }];
 await expect(respondToCartReview("7", input)).rejects.toThrow("disponibles");
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT INTO pedidos"))).toBe(false);
});

it("revierte la numeración si falla el guardado del pedido", async () => {
 const original = db.query.getMockImplementation()!;
 db.query.mockImplementation(async (sql: string) => {
  if (sql.startsWith("INSERT INTO pedidos")) throw new Error("fallo de guardado");
  return original(sql);
 });
 await expect(respondToCartReview("7", input)).rejects.toThrow("fallo de guardado");
 expect(db.query).toHaveBeenCalledWith("UPDATE pedido_numeracion SET ultimo_numero = ? WHERE id = 1", ["1"]);
 expect(db.rollback).toHaveBeenCalledOnce();
 expect(db.commit).not.toHaveBeenCalled();
});

it("guarda el detalle de venta y costos sin incluir agotados ni aplicar ajustes al costo", async () => {
 await respondToCartReview("7", input);
 const insert = db.query.mock.calls.find(([sql]) => sql.startsWith("INSERT INTO pedidos"))!;
 const values = insert[1];
 expect(JSON.parse(values[5])).toEqual([{ producto_id: "1", codigo: "A", variante: null, descripcion: "Aro de acero", nombre: "Aro", cantidad: 2, precio_costo: 25, precio_venta: 100, subtotal_costo: 50, subtotal_venta: 200 }]);
 expect(values.slice(-4)).toEqual([200, 50, 1314.9, 50]);
 expect(values[6]).toBeNull();
});
it("rechaza la dirección de envío de otra cuenta y revierte las reservas", async () => {
 cart.entrega = { method: "envio", addressId: "999", phone: "1111111", address: "Otra dirección", notes: "" };
 await expect(respondToCartReview("7", input)).rejects.toThrow("dirección");
 expect(db.rollback).toHaveBeenCalledOnce();
 expect(db.query.mock.calls.some(([sql]) => sql.startsWith("INSERT INTO pedidos"))).toBe(false);
});
