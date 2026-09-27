import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-bold">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        La dirección que estás buscando no existe o ya no está disponible.
      </p>
      <Link
        href="/"
        className="mt-8 border border-foreground bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
