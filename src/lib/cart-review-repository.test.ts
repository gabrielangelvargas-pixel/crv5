import { beforeEach, expect, it, vi } from "vitest";
import { respondToCartReview } from "./cart-review-repository";
const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db }) }));
let cart: Record<string, unknown>;
beforeEach(() => {
 vi.clearAllMocks();
 cart = { id: "cart", usuario_id: "7", estado: "actualizado", version: 2, entrega: { method: "retiro", phone: "1111111", address: "", notes: "" }, ajustes: [{ description: "Envío", amountCents: 112000 }, { description: "Redondeo", amountCents: -510 }], productos_confirmados: [{ productId: "1", quantity: 2, code: "A", name: "Aro", variant: null, unitPrice: 100, subtotal: 200 }, { productId: "2", quantity: 1, exhausted: true, subtotal: 0 }] };
 db.query.mockImplementation(async (sql: string) => {
  if (sql.includes("FROM carritos")) return [[cart]];
  if (sql.includes("SELECT p.id, p.stock")) return [[{ id: 1, stock: 5 }]];
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
