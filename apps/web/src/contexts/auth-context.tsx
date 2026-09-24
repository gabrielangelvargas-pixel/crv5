"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Role = "admin" | "supervisor" | "vendedor" | "cliente";

export type AuthUser = {
  id: number;
  nombre: string;
  usuario: string;
  roles: Role[];
};

type AuthContextValue = {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "anonymous";
  login: (usuario: string, clave: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readSession(setUser: (user: AuthUser | null) => void, setStatus: (status: AuthContextValue["status"]) => void) {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      setUser(null);
      setStatus("anonymous");
      return;
    }
    const payload = await response.json();
    setUser(payload.usuario ?? null);
    setStatus("authenticated");
  } catch {
    setUser(null);
    setStatus("anonymous");
  }
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const refresh = async () => readSession(setUser, setStatus);

  useEffect(() => { void refresh(); }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    refresh,
    async login(usuario, clave) {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo iniciar sesión.");
      setUser(payload.usuario);
      setStatus("authenticated");
    },
    async logout() {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setStatus("anonymous");
    },
  }), [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
