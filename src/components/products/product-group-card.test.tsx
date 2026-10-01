import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { Product } from "@/data/products";
import { CartProvider } from "@/components/cart/cart-provider";
import { ProductGroupCard } from "./product-group-card";

const product = { id: "a", name: "Aro", code: "A", stock: 5, imageSrc: null, offerPrice: null, salePrice: 100, priceTiers: [] } as unknown as Product;
const variant = { ...product, id: "b", variantName: "Dorado" };
beforeEach(() => localStorage.setItem("crv4-cart-v1", JSON.stringify([{ productId: "a", quantity: 5 }])));
afterEach(cleanup);

it("carga el carrito al abrir, reemplaza cantidades y permite eliminar con cero", async () => {
  render(<CartProvider products={[product]}><ProductGroupCard productGroup={{ id: "g", product, variants: [product] }} /></CartProvider>);
  await waitFor(() => expect(localStorage.getItem("crv4-cart-v1")).toContain('"quantity":5'));
  fireEvent.click(screen.getByRole("button", { name: "Ver detalles de Aro" }));
  expect(screen.getByLabelText("Cantidad seleccionada")).toHaveTextContent("5");
  expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Aumentar cantidad" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
  fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  expect(JSON.parse(localStorage.getItem("crv4-cart-v1")!)).toEqual([{ productId: "a", quantity: 4 }]);
  expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
  for (let index = 0; index < 4; index++) fireEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
  fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  expect(JSON.parse(localStorage.getItem("crv4-cart-v1")!)).toEqual([]);
  expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
});

it("carga cada variante y deja el botón deshabilitado al volver a la cantidad guardada", () => {
  render(<CartProvider products={[product, variant]}><ProductGroupCard productGroup={{ id: "g", product, variants: [product, variant] }} /></CartProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Ver detalles de Aro" }));
  fireEvent.click(screen.getByRole("button", { name: "Dorado" }));
  expect(screen.getByLabelText("Cantidad seleccionada")).toHaveTextContent("0");
  expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "A" }));
  expect(screen.getByLabelText("Cantidad seleccionada")).toHaveTextContent("5");
  fireEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
  expect(screen.getByRole("button", { name: "Actualizar" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
  expect(screen.getByRole("button", { name: "Actualizar" })).toBeDisabled();
});
