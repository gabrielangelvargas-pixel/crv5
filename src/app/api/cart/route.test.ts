import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({ user: vi.fn(), cookie: vi.fn(), sync: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/carts-repository", () => ({ CART_COOKIE: "crv4_cart", synchronizeCart: mocks.sync }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue(null);
  mocks.cookie.mockReturnValue(undefined);
  mocks.sync.mockResolvedValue({ items: [], version: 0, conflict: false });
});
const request = (body: object, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/cart", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) });

it("obtiene la identidad de la sesión y cookie, nunca del cuerpo enviado", async () => {
  mocks.user.mockResolvedValue({ id: "7" });
  mocks.cookie.mockReturnValue({ value: "token" });
  await POST(request({ userId: "otro", id: "carrito-ajeno", items: [{ productId: "1", quantity: 2 }] }));
  expect(mocks.sync).toHaveBeenCalledWith("7", "token", { items: [{ productId: "1", quantity: 2 }] });
});
it("rechaza solicitudes de otro origen y cantidades inválidas", async () => {
  expect((await POST(request({ items: [] }, "https://otro.example"))).status).toBe(403);
  expect((await POST(request({ items: [{ productId: "1", quantity: -1 }] }))).status).toBe(400);
  expect(mocks.sync).not.toHaveBeenCalled();
});
it("responde con conflicto y datos actuales para una versión desactualizada", async () => {
  mocks.sync.mockResolvedValue({ items: [{ productId: "1", quantity: 3 }], version: 4, conflict: true });
  const response = await POST(request({ items: [], version: 2 }));
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ items: [{ productId: "1", quantity: 3 }], version: 4, stock: {} });
});
it("emite la cookie anónima protegida y no expone el token en JSON", async () => {
  mocks.sync.mockResolvedValue({ items: [], version: 0, newToken: "token-secreto", conflict: false });
  const response = await POST(request({ items: [] }));
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  expect(await response.json()).toEqual({ items: [], version: 0, stock: {} });
});

it("acepta el dominio público detrás de un proxy aunque la URL interna sea localhost", async () => {
  const response = await POST(new Request("http://localhost:3000/api/cart", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://crv4mayorista.com.ar", "X-Forwarded-Host": "crv4mayorista.com.ar", "X-Forwarded-Proto": "https", Host: "localhost:3000" }, body: JSON.stringify({ items: [] }),
  }));
  expect(response.status).toBe(200);
  expect(mocks.sync).toHaveBeenCalledOnce();
});

it("acepta Host público sin forwarded-host y rechaza dominios ajenos detrás del proxy", async () => {
  const headers = { "Content-Type": "application/json", Origin: "https://crv4mayorista.com.ar", Host: "crv4mayorista.com.ar" };
  expect((await POST(new Request("http://localhost:3000/api/cart", { method: "POST", headers, body: '{"items":[]}' }))).status).toBe(200);
  mocks.sync.mockClear();
  headers.Origin = "https://otro.example";
  expect((await POST(new Request("http://localhost:3000/api/cart", { method: "POST", headers: { ...headers, "X-Forwarded-Host": "crv4mayorista.com.ar" }, body: '{"items":[]}' }))).status).toBe(403);
  expect(mocks.sync).not.toHaveBeenCalled();
});
