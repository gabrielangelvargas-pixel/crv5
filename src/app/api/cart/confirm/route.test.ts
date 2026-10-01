import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";
const mocks = vi.hoisted(() => ({ user: vi.fn(), confirm: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/confirmed-carts-repository", () => ({ confirmCart: mocks.confirm, ConfirmedCartError: class extends Error {} }));
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "7" }); mocks.confirm.mockResolvedValue({ id: "cart", version: 2 }); });
const body = { version: 1, expectedTotalCents: 100, delivery: { method: "retiro", phone: "123456", address: "", notes: "" } };
const request = (payload: object, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/cart/confirm", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(payload) });
it("exige sesión", async () => {
  mocks.user.mockResolvedValue(null);
  expect((await POST(request(body))).status).toBe(401);
  expect(mocks.confirm).not.toHaveBeenCalled();
});
it("confirma sin mínimo usando la cuenta de la sesión", async () => {
  expect((await POST(request({ ...body, userId: "otro" }))).status).toBe(201);
  expect(mocks.confirm).toHaveBeenCalledWith("7", body);
});
it("valida entrega y origen", async () => {
  expect((await POST(request({ ...body, delivery: { ...body.delivery, method: "envio" } }))).status).toBe(400);
  expect((await POST(request(body, "https://otro.example"))).status).toBe(403);
  expect(mocks.confirm).not.toHaveBeenCalled();
});
