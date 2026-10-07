import { beforeEach, expect, it, vi } from "vitest";
import type { PoolConnection } from "mysql2/promise";
import { resolveOrderAddress } from "./order-address";
const query = vi.fn();
const connection = { query } as unknown as PoolConnection;
beforeEach(() => vi.clearAllMocks());
it("retiro no requiere una dirección", async () => {
 expect(await resolveOrderAddress(connection, "7", { method: "retiro", phone: "123456", address: "", notes: "" })).toBeNull();
 expect(query).not.toHaveBeenCalled();
});
it("valida el propietario y usa la dirección guardada en la base", async () => {
 query.mockResolvedValue([[{ id: 4, direccion: "Calle 123", localidad: "Ciudad", provincia: "Provincia" }]]);
 const delivery = { method: "envio" as const, addressId: "4", phone: "123456", address: "Texto manipulado", notes: "" };
 expect(await resolveOrderAddress(connection, "7", delivery)).toBe("4");
 expect(query).toHaveBeenCalledWith(expect.stringContaining("id_usuario = ? AND activa = 1"), ["4", "7"]);
 expect(delivery.address).toBe("Calle 123, Ciudad, Provincia");
});
it("rechaza direcciones faltantes, inactivas o ajenas", async () => {
 query.mockResolvedValue([[]]);
 const delivery = { method: "envio" as const, phone: "123456", address: "Calle", notes: "" };
 await expect(resolveOrderAddress(connection, "7", delivery)).rejects.toThrow("Elegí");
 await expect(resolveOrderAddress(connection, "7", { ...delivery, addressId: "4" })).rejects.toThrow("cuenta");
});
