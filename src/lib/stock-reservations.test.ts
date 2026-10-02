import { expect, it, vi } from "vitest";
import type { PoolConnection } from "mysql2/promise";
import { availableStock } from "./stock-reservations";
it("resta las reservas de otros carritos bajo bloqueo de producto", async () => {
 const query = vi.fn().mockResolvedValueOnce([[{ id: 1, stock: 5 }]]).mockResolvedValueOnce([[{ producto_id: 1, cantidad: 3 }]]);
 const result = await availableStock({ query } as unknown as PoolConnection, ["1"], "own");
 expect(result.get("1")).toBe(2);
 expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("ORDER BY p.id FOR UPDATE"), [["1"]]);
 expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("carrito_id <> ?"), [["1"], "own"]);
});
