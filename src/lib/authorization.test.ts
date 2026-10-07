import { expect, it } from "vitest";
import { canAccessAdmin, isAdministrator } from "./authorization";

const user = (...roles: string[]) => ({ id: "1", name: "A", username: "a", roles, permissions: [] });

it("administración completa solo para administradores", () => {
  expect(isAdministrator(user("Administrador"))).toBe(true);
  expect(isAdministrator(user("admin"))).toBe(true);
  expect(isAdministrator(user("vendedor", "supervisor"))).toBe(false);
});

it("el panel comercial incluye vendedores y supervisores, no clientes", () => {
  expect(canAccessAdmin(user("vendedor"))).toBe(true);
  expect(canAccessAdmin(user("supervisor"))).toBe(true);
  expect(canAccessAdmin(user("admin"))).toBe(true);
  expect(canAccessAdmin(user("cliente"))).toBe(false);
});
