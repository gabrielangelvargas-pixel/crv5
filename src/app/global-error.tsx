"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="es">
      <head>
        <title>CRV4 | Error</title>
      </head>
      <body
        style={{
          alignItems: "center",
          background: "#fbfaf8",
          color: "#171717",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <main>
          <h1>Ocurrió un error</h1>
          <p>No pudimos cargar la aplicación. Intentá nuevamente.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#171717",
              border: 0,
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700,
              padding: "12px 18px",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
