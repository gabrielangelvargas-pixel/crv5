import { beforeAll, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { OrderEditor } from "./order-editor";
import type { Order } from "@/lib/orders-repository";
import type { Product } from "@/data/products";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeAll(() => {
 HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
 HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
const order = { id: "id", lines: [{ productId: "1", code: "A", name: "Aro", variant: null, quantity: 1, unitPrice: 100, subtotal: 100 }] } as Order;
const products = [{ id: "1", code: "A", name: "Aro", variantName: null, salePrice: 100, offerPrice: null, stock: 5, priceTiers: [] }, { id: "2", code: "B", name: "Bolso", variantName: "Azul", salePrice: 200, offerPrice: null, stock: 5, priceTiers: [] }] as unknown as Product[];
it("permite cambiar cantidad, quitar y buscar una variante nueva", () => {
  render(<OrderEditor order={order} products={products} />);
  fireEvent.click(screen.getByText("Editar pedido"));
  expect(screen.getByText("Guardar cambios")).toBeDisabled();
  fireEvent.click(screen.getByLabelText("Sumar una unidad de Aro"));
  expect(screen.getByText("Guardar cambios")).toBeEnabled();
  fireEvent.click(screen.getByLabelText("Eliminar Aro"));
  expect(screen.getByText("Guardar cambios")).toBeDisabled();
  fireEvent.change(screen.getByPlaceholderText("Buscar por nombre, código o variante"), { target: { value: "Azul" } });
  fireEvent.click(screen.getByText("Agregar"));
  expect(screen.getByLabelText("Cantidad de Bolso")).toHaveTextContent("1");
  expect(screen.getByText("Guardar cambios")).toBeEnabled();
  fireEvent.click(screen.getByText("Cancelar"));
  fireEvent.click(screen.getByText("Editar pedido"));
  expect(screen.getByLabelText("Cantidad de Aro")).toHaveTextContent("1");
  cleanup();
});
it("marca reservado y vuelve a pendiente al cambiar la cantidad", () => {
 render(<OrderEditor order={order} products={products} cartVersion={1} />);
 expect(screen.queryByText("Editar carrito")).not.toBeInTheDocument();
 const reserved = screen.getByLabelText("Reservado: Aro");
 fireEvent.click(reserved);
 expect(reserved).toBeChecked();
 expect(screen.getByText("Guardar cambios")).toBeEnabled();
 fireEvent.click(screen.getByLabelText("Sumar una unidad de Aro"));
 expect(reserved).not.toBeChecked();
 cleanup();
});

it("conserva agotados sin sumar su importe y desmarca su reserva", () => {
 render(<OrderEditor order={order} products={products} cartVersion={1} />);
 fireEvent.click(screen.getByLabelText("Reservado: Aro"));
 fireEvent.click(screen.getByLabelText("Agotado: Aro"));
 expect(screen.getByLabelText("Reservado: Aro")).not.toBeChecked();
 expect(screen.getByLabelText("Reservado: Aro")).toBeDisabled();
 expect(screen.getByText("Subtotal: $ 0,00")).toBeInTheDocument();
 expect(screen.getByLabelText("Cantidad de Aro")).toHaveTextContent("1");
 cleanup();
});

it("agrega varios conceptos, calcula el total y permite quitarlos", () => {
 render(<OrderEditor order={order} products={products} cartVersion={1} />);
 fireEvent.click(screen.getByText("Agregar concepto"));
 expect(screen.getByText("Guardar cambios")).toBeDisabled();
 fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "Redondeo" } });
 fireEvent.change(screen.getByLabelText("Importe"), { target: { value: "-5,10" } });
 fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
 expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
 expect(screen.getByText(/Redondeo:/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Agregar concepto" }));
 fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "Envío" } });
 fireEvent.change(screen.getByLabelText("Importe"), { target: { value: "1120" } });
 expect(screen.getByLabelText("Importe")).toHaveAttribute("inputmode", "decimal");
 fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
 expect(screen.getByText("Total a pagar: $ 1.214,90")).toBeInTheDocument();
 expect(screen.getByText("Guardar cambios")).toBeEnabled();
 fireEvent.click(screen.getByLabelText("Eliminar concepto 2"));
 expect(screen.getByText("Total a pagar: $ 94,90")).toBeInTheDocument();
 fireEvent.click(screen.getByText("Cancelar"));
 expect(screen.queryByText(/Redondeo:/)).not.toBeInTheDocument();
 cleanup();
});

it("cancela el modal sin agregar conceptos y permite descontar sin teclear el signo", () => {
 render(<OrderEditor order={order} products={products} cartVersion={1} />);
 fireEvent.click(screen.getByRole("button", { name: "Agregar concepto" }));
 fireEvent.click(screen.getByRole("dialog").querySelector('button[type="button"]')!);
 expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
 expect(screen.getByText("Guardar cambios")).toBeDisabled();
 fireEvent.click(screen.getByRole("button", { name: "Agregar concepto" }));
 fireEvent.change(screen.getByLabelText("Concepto"), { target: { value: "Redondeo" } });
 fireEvent.change(screen.getByLabelText("Importe"), { target: { value: "5,10" } });
 fireEvent.click(screen.getByLabelText("Descontar del subtotal"));
 fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
 expect(screen.getByText("Total a pagar: $ 94,90")).toBeInTheDocument();
 expect(screen.queryByText(/Se aplican los precios/)).not.toBeInTheDocument();
 cleanup();
});
