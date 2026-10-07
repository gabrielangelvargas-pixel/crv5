import type { AuthUser } from "@/data/auth";

export function hasRole(user: AuthUser, ...roles: string[]) {
  const userRoles = new Set(user.roles.map((role) => role.toLowerCase()));
  return roles.some((role) => userRoles.has(role.toLowerCase()));
}

// Role names live here only; routes and pages use the helpers below.
const ADMINISTRATOR_ROLES = ["administrador", "admin"];
const COMMERCIAL_ROLES = [...ADMINISTRATOR_ROLES, "vendedor", "supervisor"];

/** Full access: users, roles and categories. */
export function isAdministrator(user: AuthUser) {
  return hasRole(user, ...ADMINISTRATOR_ROLES);
}

/** Administration panel: products, carts and orders. */
export function canAccessAdmin(user: AuthUser) {
  return hasRole(user, ...COMMERCIAL_ROLES);
}
