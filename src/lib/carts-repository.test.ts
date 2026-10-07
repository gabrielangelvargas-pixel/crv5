import { beforeEach, describe, expect, it, vi } from "vitest";
import { readCart, synchronizeCart } from "./carts-repository";

const db = vi.hoisted(() => ({ query: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() }));
vi.mock("./db", () => ({ getDatabasePool: () => ({ getConnection: async () => db, query: db.query }) }));
beforeEach(() => { vi.clearAllMocks(); });

describe("persistencia del carrito", () => {
  it("fusiona visitante y cuenta una sola vez, conserva variantes y limita stock", async () => {
    db.query.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM usuarios")) return [[]];
      if (sql.includes("token_hash = ? AND usuario_id IS NULL")) return [[{ id: "guest", items: [{ productId: "1", quantity: 4 }, { productId: "2", quantity: 1 }], version: 1 }]];
      if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "account", items: [{ productId: "1", quantity: 3 }], version: 2 }]];
      if (sql.includes("SELECT p.id")) return [[{ id: 1, stock: 5 }, { id: 2, stock: 2 }]];
      return [[]];
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
      return [[]];
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
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("ultima_actividad = NOW()"), ["[]", 2, null, "guest"]);
  });

  it("hace rollback y libera la conexión si falla la base de datos", async () => {
    db.query.mockRejectedValue(new Error("database"));
    await expect(synchronizeCart(null, "a".repeat(64), { items: [] })).rejects.toThrow("database");
    expect(db.rollback).toHaveBeenCalledOnce();
    expect(db.release).toHaveBeenCalledOnce();
  });
});

it("leer un carrito confirmado conserva estado, cantidades y versión", async () => {
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "cart", estado: "confirmado", items: [{ productId: "1", quantity: 3 }], version: 2, total_estimado: "210.00", productos_confirmados: [] }]];
    return [[]];
  });
  const result = await synchronizeCart("7", undefined, { items: [] });
  expect(result.status).toBe("confirmado");
  expect(result.items).toEqual([{ productId: "1", quantity: 3 }]);
  expect(result.total).toBe(210);
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(false);
});
it("una modificación del cliente reactiva el carrito y descarta el total revisado", async () => {
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "cart", estado: "actualizado", items: [{ productId: "1", quantity: 3 }], version: 2 }]];
    if (sql.includes("SELECT p.id")) return [[{ id: 1, stock: 10 }]];
    return [[]];
  });
  const result = await synchronizeCart("7", undefined, { items: [{ productId: "1", quantity: 4 }], version: 2 });
  expect(result.status).toBe("activo");
  expect(result.version).toBe(3);
  expect(result.lines).toBeNull();
});

it("iniciar sesión con un carrito visitante vacío conserva las reservas de la cuenta", async () => {
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("token_hash = ?")) return [[{ id: "guest", items: [], version: 1 }]];
    if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "cart", estado: "actualizado", items: [{ productId: "1", quantity: 3 }], version: 2, productos_confirmados: [{ productId: "1", reserved: true }] }]];
    if (sql.includes("SELECT p.id")) return [[{ id: 1, stock: 5 }]];
    return [[]];
  });
  const result = await synchronizeCart("7", "a".repeat(64), { items: [] });
  expect(result.status).toBe("actualizado");
  expect(result.version).toBe(2);
  expect(db.query.mock.calls.some(([sql]) => sql.startsWith("DELETE FROM carrito_reservas"))).toBe(false);
});

it("conserva el historial agotado cuando el cliente modifica otros productos", async () => {
 const original = db.query.getMockImplementation()!;
 const history = { productId: "2", quantity: 2, exhausted: true, reserved: false, subtotal: 0 };
 db.query.mockImplementation(async (sql: string, args: unknown[]) => sql.includes("WHERE usuario_id = ?") ? [[{ id: "cart", estado: "actualizado", items: [{ productId: "1", quantity: 3 }], version: 2, productos_confirmados: [history] }]] : original(sql, args));
 const result = await synchronizeCart("7", undefined, { items: [{ productId: "1", quantity: 1 }], version: 2 });
 expect(result.lines).toEqual([history]);
 expect(db.query).toHaveBeenCalledWith(expect.stringContaining("productos_confirmados = ?"), expect.arrayContaining([JSON.stringify([history])]));
});

it("la consulta periódica lee sin transacción ni bloqueos y descuenta reservas ajenas", async () => {
  db.query.mockImplementation(async (sql: string) => {
    if (sql.includes("WHERE usuario_id = ?")) return [[{ id: "cart", estado: "activo", items: [{ productId: "1", quantity: 3 }], version: 4 }]];
    if (sql.includes("SELECT p.id")) return [[{ id: 1, disponible: 2 }]];
    return [[]];
  });
  const result = await readCart("7", undefined);
  expect(result).toMatchObject({ id: "cart", items: [{ productId: "1", quantity: 3 }], version: 4, status: "activo", stock: { "1": 2 } });
  expect(db.beginTransaction).not.toHaveBeenCalled();
  expect(db.query.mock.calls.some(([sql]) => /FOR UPDATE|^UPDATE|^DELETE|^INSERT/.test(sql))).toBe(false);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining("r.carrito_id <> ?"), ["cart", ["1"]]);
});
it("sin cuenta ni token válido la consulta devuelve un carrito vacío sin tocar la base", async () => {
  expect(await readCart(null, "no-es-un-token")).toMatchObject({ id: "", items: [], version: 0 });
  expect(db.query).not.toHaveBeenCalled();
});
