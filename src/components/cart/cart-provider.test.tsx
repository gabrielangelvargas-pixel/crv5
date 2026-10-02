import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Product } from "../../data/products";
import { CartProvider, useCart } from "./cart-provider";

const products = [{ id: "a", stock: 5 }] as Product[];
function Controls() {
  const { items, ready, syncError, addItem, setQuantity, removeItem } = useCart();
  return <><output>{ready ? items[0]?.quantity ?? 0 : "loading"}</output>
    <button onClick={() => addItem("a", 2)}>Agregar</button>
    <button onClick={() => setQuantity("a", 3)}>Editar</button>
    <button onClick={() => removeItem("a")}>Eliminar</button>{syncError ? <span>Sin sincronizar</span> : null}</>;
}
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (_url, options) => ({ ok: true, status: 200, json: async () => ({ items: JSON.parse(options.body).items, version: 1 }) })));
});

it("recupera la cuenta desde el servidor sin reimportar su copia local", async () => {
  localStorage.setItem("crv4-cart-user-7", '[{"productId":"a","quantity":2}]');
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ items: [{ productId: "a", quantity: 4 }], version: 3 }) })));
  render(<CartProvider products={products} userId="7"><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("4"));
  await waitFor(() => expect(JSON.parse(localStorage.getItem("crv4-cart-user-7")!)).toEqual([{ productId: "a", quantity: 4 }]));
});

it("continúa usando el respaldo local cuando el servidor falla", async () => {
  localStorage.setItem("crv4-cart-v1", '[{"productId":"a","quantity":2}]');
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  render(<CartProvider products={products}><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2"));
  expect(screen.getByText("Sin sincronizar")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Editar"));
  expect(JSON.parse(localStorage.getItem("crv4-cart-v1")!)).toEqual([{ productId: "a", quantity: 3 }]);
});

it("ante un conflicto restaura el carrito actual del servidor y avisa", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [], version: 1 }) })
    .mockResolvedValue({ ok: false, status: 409, json: async () => ({ items: [{ productId: "a", quantity: 5 }], version: 2 }) }));
  render(<CartProvider products={products}><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0"));
  fireEvent.click(screen.getByText("Agregar"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("5"));
  expect(screen.getByText("Sin sincronizar")).toBeInTheDocument();
});

it("reintenta una eliminación pendiente al volver a abrir sin restaurar productos borrados", async () => {
  localStorage.setItem("crv4-cart-v1", "[]");
  localStorage.setItem("crv4-cart-v1-sync", '{"pending":true,"version":4}');
  const fetchMock = vi.fn(async (_url, options) => ({ ok: true, status: 200, json: async () => ({ items: JSON.parse(options.body).items, version: 5 }) }));
  vi.stubGlobal("fetch", fetchMock);
  render(<CartProvider products={products}><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0"));
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ items: [], version: 4 });
  expect(JSON.parse(localStorage.getItem("crv4-cart-v1-sync")!).pending).toBe(false);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("conserva el carrito visitante después de volver a montar y permite editar y eliminar", async () => {
  const first = render(<CartProvider products={products}><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0"));
  fireEvent.click(screen.getByText("Agregar"));
  fireEvent.click(screen.getByText("Agregar"));
  expect(screen.getByRole("status")).toHaveTextContent("4");
  first.unmount();
  render(<CartProvider products={products}><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("4"));
  fireEvent.click(screen.getByText("Editar"));
  expect(screen.getByRole("status")).toHaveTextContent("3");
  fireEvent.click(screen.getByText("Eliminar"));
  expect(JSON.parse(localStorage.getItem("crv4-cart-v1") ?? "null")).toEqual([]);
});

it("acepta cambios de otra pestaña y limita la cantidad al stock", async () => {
  render(<CartProvider products={products}><Controls /></CartProvider>);
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("0"));
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ items: [{ productId: "a", quantity: 20 }], version: 2 }) })));
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "crv4-cart-v1", newValue: '[{"productId":"a","quantity":20}]' })));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("5"));
});
