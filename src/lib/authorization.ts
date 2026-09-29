import type { AuthUser } from "@/data/auth";

export function hasRole(user: AuthUser, ...roles: string[]) {
  const userRoles = new Set(user.roles.map((role) => role.toLowerCase()));
  return roles.some((role) => userRoles.has(role.toLowerCase()));
}

export function canAccessAdmin(user: AuthUser) {
  return hasRole(user, "administrador", "admin", "vendedor");
}
