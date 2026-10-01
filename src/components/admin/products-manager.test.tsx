import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { AdminProduct } from "@/lib/admin-products-repository";
import type { AdminCategory } from "@/lib/admin-categories-repository";
import { ProductsManager } from "./products-manager";

const product: AdminProduct = { id: "1", groupId: "g", groupName: "Grupo", categoryId: "c", categoryName: "Aros", code: "ARO-1", name: "Aro plata", variantName: "Plata", slug: "aro-1", description: "Descripción", salePrice: 100, offerPrice: 90, stock: 5, imageUrl: "/productos/aro-1.webp", order: 2, active: true, priceTiers: [{ minimumQuantity: 3, unitPrice: 80 }] };
function setup() {
  render(<ProductsManager initialProducts={[product]} categories={[{ id: "c", name: "Aros", depth: 0 } as AdminCategory]} groups={[{ id: "g", name: "Grupo", slug: "grupo", categoryId: "c" }]} />);
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("abre una copia editable sin identificadores únicos ni imagen y cancelar no guarda", () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Duplicar Aro plata (ARO-1)" }));
  expect(screen.getByRole("heading", { name: "Duplicar producto" })).toBeInTheDocument();
  expect(screen.getByLabelText("Nombre")).toHaveValue("Aro plata");
  expect(screen.getByLabelText("Código")).toHaveValue("");
  expect(screen.getByLabelText("Slug")).toHaveValue("");
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
  fireEvent.click(screen.getByRole("button", { name: "Duplicar Aro plata (ARO-1)" }));
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
