import { beforeEach, describe, expect, it, vi } from "vitest";
import { synchronizeCart } from "./carts-repository";

const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db }) }));
beforeEach(() => { vi.clearAllMocks(); });

describe("persistencia del carrito", () => {
  it("fusiona visitante y cuenta una sola vez, conserva variantes y limita stock", async () => {
    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM usuarios")) return [[]];
      if (sql.includes("token_hash = ? AND usuario_id IS NULL")) return [[{ id: "guest", items: [{ productId: "1", quantity: 4 }, { productId: "2", quantity: 1 }], version: 1 }]];
      if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "account", items: [{ productId: "1", quantity: 3 }], version: 2 }]];
      if (sql.includes("SELECT p.id")) return [[{ id: 1, stock: 5 }, { id: 2, stock: 2 }]];
      return [{}];
    });
    const result = await synchronizeCart("7", "a".repeat(64), { items: [] });
    expect(result.items).toEqual([{ productId: "1", quantity: 5 }, { productId: "2", quantity: 1 }]);
    expect(result.version).toBe(3);
    expect(result.clearToken).toBe(true);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("estado = 'fusionado'"), ["guest"]);
    expect(db.commit).toHaveBeenCalledOnce();
  });

  it("rechaza una versión vieja sin sobrescribir el contenido vigente", async () => {
    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("token_hash = ?")) return [[{ id: "guest", items: [{ productId: "1", quantity: 2 }], version: 4 }]];
      if (sql.includes("SELECT p.id")) return [[{ id: 1, stock: 5 }]];
      return [{}];
    });
    const result = await synchronizeCart(null, "a".repeat(64), { items: [{ productId: "1", quantity: 5 }], version: 3 });
    expect(result.conflict).toBe(true);
    expect(result.items).toEqual([{ productId: "1", quantity: 2 }]);
    expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
  });

  it("volver a consultar una cuenta no reimporta localStorage ni reinicia actividad", async () => {
    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "account", items: [{ productId: "1", quantity: 2 }], version: 1 }]];
      if (sql.includes("SELECT p.id")) return [[{ id: 1, stock: 10 }]];
      return [[]];
    });
    const result = await synchronizeCart("7", undefined, { items: [{ productId: "1", quantity: 2 }] });
    expect(result.items).toEqual([{ productId: "1", quantity: 2 }]);
    expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
  });

  it("elimina todos los productos con cantidades vacías y guarda la nueva versión", async () => {
    db.query.mockResolvedValueOnce([[{ id: "guest", items: [{ productId: "1", quantity: 2 }], version: 1 }]]).mockResolvedValue([{}]);
    const result = await synchronizeCart(null, "a".repeat(64), { items: [], version: 1 });
    expect(result.items).toEqual([]);
    expect(result.version).toBe(2);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("ultima_actividad = NOW()"), ["[]", 2, "guest"]);
  });

  it("hace rollback y libera la conexión si falla la base de datos", async () => {
    db.query.mockRejectedValue(new Error("database"));
    await expect(synchronizeCart(null, "a".repeat(64), { items: [] })).rejects.toThrow("database");
    expect(db.rollback).toHaveBeenCalledOnce();
    expect(db.release).toHaveBeenCalledOnce();
  });
});
