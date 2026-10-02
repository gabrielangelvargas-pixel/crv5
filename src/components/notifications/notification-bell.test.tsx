import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationBell } from "./notification-bell";
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: auth.useAuth }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("muestra contador y permite marcar los avisos como leídos", async () => {
 auth.useAuth.mockReturnValue({ user: { id: "7", roles: ["vendedor"] } });
 const fetchMock = vi.fn(async (_url: string, options?: { method?: string }) => ({ ok: true, json: async () => options?.method === "PATCH" ? { ok: true } : { unread: 1, notifications: [{ id: "1", cartId: "cart", customer: "Gabriel", products: 2, units: 3, total: 100, created: "2026-10-01T20:00:00Z", read: false }] } }));
 vi.stubGlobal("fetch", fetchMock);
 render(<NotificationBell />);
 await waitFor(() => expect(screen.getByLabelText("Notificaciones, 1 sin leer")).toBeInTheDocument());
 fireEvent.click(screen.getByLabelText("Notificaciones, 1 sin leer"));
 expect(screen.getByText(/Gabriel envió un carrito/)).toBeInTheDocument();
 expect(screen.getByRole("link")).toHaveAttribute("href", "/admin/carritos?carrito=cart#carrito-cart");
 fireEvent.click(screen.getByText("Marcar todas como leídas"));
 await waitFor(() => expect(screen.getByLabelText("Notificaciones, 0 sin leer")).toBeInTheDocument());
 expect(fetchMock.mock.calls.some(([, options]) => options?.method === "PATCH")).toBe(true);
});
it("no muestra campana a clientes", () => {
 auth.useAuth.mockReturnValue({ user: { id: "8", roles: ["cliente"] } });
 render(<NotificationBell />);
 expect(screen.queryByRole("button")).not.toBeInTheDocument();
});