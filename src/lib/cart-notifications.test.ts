import { expect, it, vi } from "vitest";
import type { PoolConnection } from "mysql2/promise";
import { notifyCartSubmitted, canReceiveCartNotifications, readCartNotification } from "./cart-notifications";
const pool = vi.hoisted(() => ({ query: vi.fn().mockResolvedValue([[]]) }));
vi.mock("./db", () => ({ getDatabasePool: () => pool }));
it("crea avisos solo para administradores y vendedores activos, sin duplicar roles", async () => {
 const query = vi.fn();
 await notifyCartSubmitted({ query } as unknown as PoolConnection, { cartId: "cart", userId: "7", version: 2, products: 2, units: 3, total: 100 });
 expect(query).toHaveBeenCalledWith(expect.stringContaining("SELECT DISTINCT"), ["cart", 2, 2, 3, 100, "7"]);
 expect(query.mock.calls[0]?.[0]).toContain("u.activo = 1");
 expect(query.mock.calls[0]?.[0]).toContain("'admin','administrador','vendedor'");
});
it("solo permite roles destinatarios", () => {
 const user = { id: "7", name: "A", username: "A", roles: ["vendedor"], permissions: [] };
 expect(canReceiveCartNotifications(user)).toBe(true);
 expect(canReceiveCartNotifications({ ...user, roles: ["cliente"] })).toBe(false);
 expect(canReceiveCartNotifications({ ...user, roles: ["supervisor"] })).toBe(false);
});
it("la lectura se limita al destinatario autenticado", async () => {
 await readCartNotification("7", "9");
 expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("usuario_id = ?"), ["7", "9"]);
});
