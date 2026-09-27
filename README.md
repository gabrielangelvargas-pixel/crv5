# CRV4

Plantilla base para aplicaciones con Next.js, React, TypeScript estricto y App
Router.

## Stack

- Node.js 24 LTS
- pnpm 11
- Next.js 16
- React 19
- TypeScript en modo estricto
- Tailwind CSS 4
- ESLint, Prettier, Vitest y Playwright

## Primer uso

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts

```bash
pnpm dev          # Servidor local
pnpm build        # Build de produccion
pnpm start        # Ejecuta el build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript sin emitir archivos
pnpm format       # Verifica formato
pnpm test         # Tests unitarios/componentes
pnpm test:e2e     # Tests end-to-end
pnpm validate     # Lint + typecheck + tests + build
```

## Estructura

```text
src/
  app/         Rutas, layouts y Server Components del App Router
  components/  Componentes reutilizables
  config/      Configuracion tipada de entorno
  lib/         Utilidades compartidas
  test/        Setup de tests
e2e/           Tests end-to-end
```

## Convenciones

- Server Components por defecto.
- Usar Client Components solo para interaccion, estado local o APIs del navegador.
- Validar variables de entorno en `src/config/env.ts`.
- Mantener la logica de dominio fuera de `app/` cuando sea reutilizable.
- Ejecutar `pnpm validate` antes de integrar cambios.

## Pendientes de producto

Definir antes de construir features reales:

- Autenticacion y modelo de permisos.
- Base de datos, ORM y estrategia de migraciones.
- Estrategia de datos: Server Actions, Route Handlers, REST, tRPC o GraphQL.
- Observabilidad y manejo de errores.
- CI/CD y destino de deploy.
