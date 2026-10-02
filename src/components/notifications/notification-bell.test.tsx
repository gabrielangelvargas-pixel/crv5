import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationBell } from "./notification-bell";
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: auth.useAuth }));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
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
it("no muestra campana sin sesión", () => {
 auth.useAuth.mockReturnValue({ user: null });
 render(<NotificationBell />);
 expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("sonido solo para avisos nuevos, con activación y opción de silenciar", async () => {
 auth.useAuth.mockReturnValue({ user: { id: "7", roles: ["vendedor"] } });
 const start = vi.fn();
 class TestAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  createOscillator() { return { type: "", frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn(), start, stop: vi.fn() }; }
  createGain() { return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }; }
 }
 vi.stubGlobal("AudioContext", TestAudioContext);
 let id = "1";
 vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ unread: 1, notifications: [{ id, cartId: "cart", customer: "Gabriel", products: 1, units: 1, total: 100, created: "2026-10-01T20:00:00Z", read: false }] }) })));
 render(<NotificationBell />);
 await waitFor(() => expect(screen.getByLabelText("Notificaciones, 1 sin leer")).toBeInTheDocument());
 expect(start).not.toHaveBeenCalled();
 fireEvent.click(screen.getByLabelText("Notificaciones, 1 sin leer"));
 fireEvent.click(screen.getByText("Activar sonido"));
 await waitFor(() => expect(screen.getByText("Silenciar avisos")).toBeInTheDocument());
 expect(start).toHaveBeenCalledTimes(2);
 expect(localStorage.getItem("crv4-notification-sound-7")).toBe("true");
 await new Promise(resolve => setTimeout(resolve, 0));
 fireEvent.click(screen.getByLabelText("Cerrar notificaciones"));
 id = "2";
 fireEvent.click(screen.getByLabelText("Notificaciones, 1 sin leer"));
 await waitFor(() => expect(start).toHaveBeenCalledTimes(4));
 fireEvent.click(screen.getByText("Silenciar avisos"));
 expect(localStorage.getItem("crv4-notification-sound-7")).toBe("false");
 await new Promise(resolve => setTimeout(resolve, 0));
 fireEvent.click(screen.getByLabelText("Cerrar notificaciones"));
 id = "3";
 fireEvent.click(screen.getByLabelText("Notificaciones, 1 sin leer"));
 await new Promise(resolve => setTimeout(resolve, 25));
 expect(start).toHaveBeenCalledTimes(4);
});

it("el cliente recibe la revisión con enlace a su carrito", async () => {
 auth.useAuth.mockReturnValue({ user: { id: "8", roles: ["cliente"] } });
 vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ unread: 1, notifications: [{ id: "5", kind: "actualizacion", cartId: "cart", customer: "Cliente", products: 1, units: 2, total: 100, created: "2026-10-01T20:00:00Z", read: false }] }) })));
 render(<NotificationBell />);
 await waitFor(() => expect(screen.getByLabelText("Notificaciones, 1 sin leer")).toBeInTheDocument());
 fireEvent.click(screen.getByLabelText("Notificaciones, 1 sin leer"));
 expect(screen.getByText("Administración actualizó tu carrito")).toBeInTheDocument();
 expect(screen.getByRole("link")).toHaveAttribute("href", "/carrito");
});
