import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { Product } from "../../data/products";
import { CartProvider, useCart } from "./cart-provider";

const products = [{ id: "a", stock: 5 }] as Product[];
function Controls() {
  const { items, ready, addItem, setQuantity, removeItem } = useCart();
  return <><output>{ready ? items[0]?.quantity ?? 0 : "loading"}</output>
    <button onClick={() => addItem("a", 2)}>Agregar</button>
    <button onClick={() => setQuantity("a", 3)}>Editar</button>
    <button onClick={() => removeItem("a")}>Eliminar</button></>;
}
beforeEach(() => localStorage.clear());
afterEach(cleanup);

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
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "crv4-cart-v1", newValue: '[{"productId":"a","quantity":20}]' })));
  expect(screen.getByRole("status")).toHaveTextContent("5");
});
