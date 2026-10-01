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

### Carritos persistentes

Antes de desplegar esta funcionalidad, aplicar `database/carritos.sql` en la base de datos del entorno. Con las variables de conexión en `.env.local`, ejecutar `node --env-file=.env.local scripts/migrate-carts.mjs`. La migración crea una tabla nueva y puede ejecutarse nuevamente.

El servidor guarda variantes y cantidades, valida el stock y controla la versión del carrito. Los visitantes usan una cookie HttpOnly de 180 días; los clientes recuperan el carrito de su cuenta. Al iniciar sesión se fusiona el carrito anónimo una sola vez. Al cerrar sesión se conserva el carrito de la cuenta en el servidor y se cambia al respaldo local del visitante. LocalStorage utiliza claves separadas por cuenta.

`/admin/carritos` está disponible para administradores, vendedores y supervisores. Un carrito con productos se muestra como abandonado después de 24 horas sin modificaciones. Consultarlo no reinicia ese plazo. El panel muestra hasta 200 carritos recientes y calcula totales con precios actuales. Los recordatorios y la conversión a pedido quedan pendientes de implementar el cierre del pedido.

Prueba de integración opcional: iniciar `pnpm dev --port 3100` y ejecutar `node --env-file=.env.local scripts/test-cart-integration.mjs`. Requiere las tablas de productos, usuarios y sesiones y un producto activo con stock de al menos 5 unidades. La prueba crea y elimina una cuenta y carritos temporales, sin modificar productos.

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
