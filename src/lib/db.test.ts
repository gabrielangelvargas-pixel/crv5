import { afterEach, expect, it, vi } from "vitest";
import { getDatabasePool } from "./db";
const createPool = vi.hoisted(() => vi.fn(() => ({ query: vi.fn() })));
vi.mock("mysql2/promise", () => ({ createPool }));
afterEach(() => { globalThis.crv4DatabasePool = undefined; vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("reutiliza un solo pool en producción y limita conexiones inactivas", () => {
  globalThis.crv4DatabasePool = undefined;
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DATABASE_HOST", "db.test");
  vi.stubEnv("DATABASE_NAME", "test");
  vi.stubEnv("DATABASE_USER", "test");
  vi.stubEnv("DATABASE_PASSWORD", "test");
  const pool = getDatabasePool();
  for (let i = 0; i < 100; i++) expect(getDatabasePool()).toBe(pool);
  expect(createPool).toHaveBeenCalledOnce();
  expect(createPool).toHaveBeenCalledWith(expect.objectContaining({ connectionLimit: 10, maxIdle: 2, idleTimeout: 60000 }));
});
