"use client";

export default function GlobalError() {
  return (
    <html lang="es">
      <head>
        <title>CRV4 | Error</title>
      </head>
      <body>
        <main>
          <h1>Ocurrió un error</h1>
          <p>No pudimos cargar la aplicación.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Volver al inicio</a>
        </main>
      </body>
    </html>
  );
}
