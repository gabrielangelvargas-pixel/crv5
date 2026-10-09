import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { AdminProduct } from "@/lib/admin-products-repository";
import type { AdminCategory } from "@/lib/admin-categories-repository";
import { nextVariantCode, ProductsManager } from "./products-manager";

const product: AdminProduct = { id: "1", groupId: "g", groupName: "Grupo", categoryId: "c", categoryName: "Aros", code: "ARO-1", name: "Aro plata", variantName: "Plata", slug: "aro-1", description: "Descripción", costPrice: 25, salePrice: 100, offerPrice: 90, stock: 5, availableStock: 5, imageUrl: "/productos/aro-1.webp", order: 2, active: true, priceTiers: [{ minimumQuantity: 3, unitPrice: 80 }] };
function setup(products = [product]) {
  render(<ProductsManager initialProducts={products} categories={[{ id: "c", name: "Aros", depth: 0 } as AdminCategory]} groups={[{ id: "g", name: "Grupo", slug: "grupo", categoryId: "c" }]} />);
  for (const toggle of screen.queryAllByRole("button", { expanded: false })) fireEvent.click(toggle);
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("agrupa las variantes como la tienda y las muestra al expandir el grupo", () => {
  const variant = { ...product, id: "2", code: "ARO-2", variantName: "Dorado", salePrice: 120, offerPrice: null, stock: 3, active: false };
  const standalone = { ...product, id: "3", groupId: null, groupName: null, code: "SUELTO", name: "Producto suelto" };
  render(<ProductsManager initialProducts={[product, standalone, variant]} categories={[]} groups={[]} />);
  const toggle = screen.getByRole("button", { name: /Grupo\s*2 variantes/ });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByText("$90 – $120")).toBeInTheDocument();
  expect(screen.getByText("1 de 2 activas")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Editar Aro plata (ARO-2)" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Editar Producto suelto (SUELTO)" })).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "Editar Aro plata (ARO-1)" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Editar Aro plata (ARO-2)" })).toBeInTheDocument();
  expect(screen.getByText("Dorado")).toBeInTheDocument();
});

it("agregar variante abre una copia de la primera dentro del mismo grupo", () => {
  vi.stubGlobal("fetch", vi.fn());
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Agregar variante a Grupo" }));
  expect(screen.getByRole("heading", { name: "Nueva variante" })).toBeInTheDocument();
  expect(screen.getByLabelText("Grupo de producto")).toHaveValue("g");
  expect(screen.getByLabelText("Código")).toHaveValue("ARO-2");
});

it("abre una copia editable sin identificadores únicos ni imagen y cancelar no guarda", () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Copiar Aro plata (ARO-1)" }));
  expect(screen.getByRole("heading", { name: "Nueva variante" })).toBeInTheDocument();
  expect(screen.getByLabelText("Nombre")).toHaveValue("Aro plata");
  expect(screen.getByLabelText("Código")).toHaveValue("ARO-2");
  expect(screen.getByLabelText("Slug")).toHaveValue("aro-2");
  expect(screen.getByLabelText("Stock")).toHaveValue(5);
  expect(screen.getByLabelText("Precio unitario")).toHaveValue(80);
  expect(screen.queryByText(/Actual:/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(fetchMock).not.toHaveBeenCalled();
});

it("sube una imagen nueva y envía una creación sin el ID original", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ path: "/productos/aro-2.webp" }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Respuesta de prueba" }) });
  vi.stubGlobal("fetch", fetchMock);
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Copiar Aro plata (ARO-1)" }));
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "ARO-2" } });
  expect(screen.getByLabelText("Slug")).toHaveValue("aro-2");
  fireEvent.change(screen.getByLabelText("Imagen WEBP"), { target: { files: [new File(["image"], "aro.png", { type: "image/png" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(fetchMock.mock.calls[0]![0]).toBe("/api/admin/products/upload");
  const saved = JSON.parse(fetchMock.mock.calls[1]![1].body);
  expect(saved.id).toBeUndefined();
  expect(saved.code).toBe("ARO-2");
  expect(saved.imageUrl).toBe("/productos/aro-2.webp");
  expect(saved.groupId).toBe("g");
  expect(product.code).toBe("ARO-1");
});

it("un producto nuevo crea su grupo con el SKU y la variante inicial SKU-1", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Respuesta de prueba" }) });
  vi.stubGlobal("fetch", fetchMock);
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Nuevo producto" }));
  expect(screen.queryByLabelText("Grupo de producto")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("SKU del producto"), { target: { value: "AB123" } });
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Aro nuevo" } });
  fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Aro de acero" } });
  expect(screen.getByLabelText("Código")).toHaveValue("AB123-1");
  expect(screen.getByLabelText("Slug")).toHaveValue("ab123-1");
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({ groupId: "__new__", newGroupName: "AB123", newGroupSlug: "ab123", code: "AB123-1", name: "Aro nuevo", description: "Aro de acero", categoryId: "c" });
});

it("no permite crear un producto con un SKU que ya tiene grupo", () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Nuevo producto" }));
  fireEvent.change(screen.getByLabelText("SKU del producto"), { target: { value: "grupo" } });
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Repetido" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(screen.getByText(/Ya existe un producto con ese SKU/)).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("sugiere el siguiente código libre de la variante", () => {
  expect(nextVariantCode("04286048-1", ["04286048-1", "04286048-2", "05808007-9"])).toBe("04286048-3");
  expect(nextVariantCode("ABC", ["ABC"])).toBe("ABC-2");
});
