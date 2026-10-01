import { expect, it } from "vitest";
import { getAuthReturnPath } from "./auth-return";
it("conserva el regreso al pedido y rechaza redirecciones externas", () => {
  expect(getAuthReturnPath("?next=%2Fpedido%2Fconfirmar")).toBe("/pedido/confirmar");
  expect(getAuthReturnPath("?next=https://otro.example")).toBeNull();
  expect(getAuthReturnPath("?next=//otro.example")).toBeNull();
});
