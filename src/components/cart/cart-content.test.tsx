import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { CartContent } from "./cart-content";
const mocks = vi.hoisted(() => ({ cart: vi.fn(), push: vi.fn(), refresh: vi.fn(), checkout: vi.fn(), reload: vi.fn() }));
vi.mock("./cart-provider", () => ({ useCart: mocks.cart }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
beforeEach(() => {
 vi.clearAllMocks(); mocks.checkout.mockResolvedValue({ version: 2, items: [{ productId: "1", quantity: 1 }] });
 mocks.cart.mockReturnValue({ cartId: "cart", ready: true, status: "actualizado", items: [{ productId: "1", quantity: 1 }], products: [{ id: "1", name: "Aro", code: "A", stock: 5, salePrice: 100, priceTiers: [], imageSrc: "" }], adjustments: [{ description: "Envío", amountCents: 1000 }], confirmedLines: [{ productId: "1", unitPrice: 100 }], confirmedTotal: 100, prepareCheckout: mocks.checkout, refreshCart: mocks.reload });
});
it("acepta la revisión con el total y abre el pedido pendiente de pago", async () => {
 const fetchMock = vi.fn(async (_url: string, _options: { body: string }) => { void _url; void _options; return { ok: true, json: async () => ({ orderId: "order" }) }; });
 vi.stubGlobal("fetch", fetchMock);
 render(<CartContent />);
 fireEvent.click(screen.getByText("Confirmar & Pagar"));
 await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/pedidos?confirmado=order"));
 expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({ cartId: "cart", action: "accept", version: 2, expectedTotalCents: 11000 });
 cleanup(); vi.unstubAllGlobals();
});
it("seguir comprando pide reactivar incluso sin cambiar cantidades", async () => {
 const fetchMock = vi.fn(async (_url: string, _options: { body: string }) => { void _url; void _options; return { ok: true, json: async () => ({ status: "activo" }) }; });
 vi.stubGlobal("fetch", fetchMock);
 render(<CartContent />);
 fireEvent.click(screen.getByText("Seguir comprando"));
 await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"));
 expect(JSON.parse(fetchMock.mock.calls[0]![1].body).action).toBe("continue");
 cleanup(); vi.unstubAllGlobals();
});
it("un conflicto de revisión muestra el error sin generar navegación", async () => {
 vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "El carrito cambió" }) })));
 render(<CartContent />);
 fireEvent.click(screen.getByText("Confirmar & Pagar"));
 await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("El carrito cambió"));
 expect(mocks.push).not.toHaveBeenCalled();
 cleanup(); vi.unstubAllGlobals();
});
