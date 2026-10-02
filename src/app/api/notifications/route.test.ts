import { beforeEach, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";
const mocks = vi.hoisted(() => ({ user: vi.fn(), list: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/cart-notifications", () => ({ canReceiveCartNotifications: (user: { roles: string[] }) => user.roles.includes("admin"), getCartNotifications: mocks.list, readCartNotification: mocks.read }));
const request = (body: object, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/notifications", { method: "PATCH", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "7", roles: ["admin"] }); mocks.list.mockResolvedValue({ unread: 1, notifications: [] }); });
it("exige sesión y permite consultar al cliente sus propios avisos", async () => {
 mocks.user.mockResolvedValue(null); expect((await GET()).status).toBe(401);
 mocks.user.mockResolvedValue({ id: "7", roles: ["cliente"] }); expect((await GET()).status).toBe(200);
 expect(mocks.list).toHaveBeenCalledWith("7");
});
it("lista únicamente avisos de la sesión", async () => { expect((await GET()).status).toBe(200); expect(mocks.list).toHaveBeenCalledWith("7"); });
it("marca uno o todos únicamente para el usuario autenticado", async () => {
 expect((await PATCH(request({ id: "12", userId: "otro" }))).status).toBe(200);
 expect(mocks.read).toHaveBeenCalledWith("7", "12");
 expect((await PATCH(request({ all: true }))).status).toBe(200);
 expect(mocks.read).toHaveBeenCalledWith("7", undefined);
});
it("valida origen e identificador", async () => {
 expect((await PATCH(request({ id: "-1" }))).status).toBe(400);
 expect((await PATCH(request({ all: true }, "https://other.test"))).status).toBe(403);
 expect(mocks.read).not.toHaveBeenCalled();
});
