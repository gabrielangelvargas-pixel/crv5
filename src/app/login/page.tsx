"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "No se pudo iniciar sesión");
        return;
      }

      window.dispatchEvent(new Event("crv4:auth-changed"));
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-4 py-10 text-foreground">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-8">
        <h1 className="text-2xl font-black uppercase tracking-[0.06em]">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-foreground/60">Accedé a tu cuenta CRV4 Mayorista.</p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Usuario
            <input
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15"
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full border border-black/15 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-white/15"
              required
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-600" role="alert">{error}</p> : null}

        <button type="submit" disabled={isSubmitting} className="mt-6 w-full bg-zinc-950 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-950">
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
