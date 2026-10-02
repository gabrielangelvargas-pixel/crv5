import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";
const mocks = vi.hoisted(() => ({ user: vi.fn(), respond: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/cart-review-repository", () => ({ respondToCartReview: mocks.respond }));
const body = { cartId: "b87f9e1b-0c10-40e1-995e-ff0d8f3f0137", version: 2, action: "accept", expectedTotalCents: 100 };
const request = (input: object, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/cart/review", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(input) });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "7" }); mocks.respond.mockResolvedValue({ orderId: "order", status: "confirmado" }); });
it("exige sesión, origen válido y el importe a aceptar", async () => {
 expect((await POST(request(body, "https://other.test"))).status).toBe(403);
 mocks.user.mockResolvedValue(null);
 expect((await POST(request(body))).status).toBe(401);
 mocks.user.mockResolvedValue({ id: "7" });
 expect((await POST(request({ ...body, expectedTotalCents: undefined }))).status).toBe(400);
 expect(mocks.respond).not.toHaveBeenCalled();
});
it("usa al propietario autenticado, nunca el usuario del cuerpo", async () => {
 expect((await POST(request({ ...body, userId: "8" }))).status).toBe(200);
 expect(mocks.respond).toHaveBeenCalledWith("7", body);
});
