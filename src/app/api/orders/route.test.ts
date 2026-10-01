import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";
const mocks = vi.hoisted(() => ({ user: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/orders-repository", () => ({ createOrder: mocks.create, OrderError: class extends Error {} }));
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "7" }); mocks.create.mockResolvedValue("order"); });
const body = { key: "11111111-1111-4111-8111-111111111111", version: 1, expectedTotalCents: 100, delivery: { method: "retiro", phone: "123456", address: "", notes: "" } };
const request = (payload: object, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/orders", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(payload) });
it("exige sesión y no crea pedidos anónimos", async () => {
  mocks.user.mockResolvedValue(null);
  expect((await POST(request(body))).status).toBe(401);
  expect(mocks.create).not.toHaveBeenCalled();
});
it("toma el usuario de la sesión y permite importes debajo de $70.000", async () => {
  expect((await POST(request({ ...body, userId: "otro" }))).status).toBe(201);
  expect(mocks.create).toHaveBeenCalledWith("7", body);
});
it("rechaza envíos sin dirección y solicitudes ajenas", async () => {
  expect((await POST(request({ ...body, delivery: { ...body.delivery, method: "envio" } }))).status).toBe(400);
  expect((await POST(request(body, "https://otro.example"))).status).toBe(403);
  expect(mocks.create).not.toHaveBeenCalled();
});
