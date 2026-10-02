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

### Carritos confirmados y revisión administrativa

Aplicar la migración con `node --env-file=.env.local scripts/migrate-confirmed-carts.mjs` antes de desplegar, incluso si ya existe la tabla carritos. Agrega estados y los datos de entrega, detalle e importe estimado. Puede ejecutarse nuevamente.

Desde `/carrito/confirmar` el cliente inicia sesión o se registra (sesión persistente de 30 días) y envía su carrito. El mismo registro queda `confirmado`, mantiene propietario y productos y no genera pedidos. No hay mínimo y no reserva ni descuenta stock. La antigua ruta `/pedido/confirmar` redirige al carrito; la API de creación de pedidos responde 410.

En Administración → Carritos se editan cantidades, se quitan productos y se agregan variantes buscando por nombre o código. Guardar verifica la versión y los precios y deja el carrito `actualizado`. El cliente ve los cambios y el total guardado; la aceptación final se implementará en el próximo paso. Si modifica los productos vuelve a `activo` y debe enviarlo nuevamente. Consultarlo no altera el estado. Los pedidos anteriores permanecen como historial.

Prueba real con registros temporales: iniciar `pnpm dev --port 3100` y ejecutar `node --env-file=.env.local scripts/test-confirmed-cart-integration.mjs`. La prueba elimina sus cuentas/carritos temporales y verifica que no se creen pedidos ni se modifique el stock.

### Carritos persistentes

Antes de desplegar esta funcionalidad, aplicar `database/carritos.sql` en la base de datos del entorno. Con las variables de conexión en `.env.local`, ejecutar `node --env-file=.env.local scripts/migrate-carts.mjs`. La migración crea una tabla nueva y puede ejecutarse nuevamente.

El servidor guarda variantes y cantidades, valida el stock y controla la versión del carrito. Los visitantes usan una cookie HttpOnly de 180 días; los clientes recuperan el carrito de su cuenta. Al iniciar sesión se fusiona el carrito anónimo una sola vez. Al cerrar sesión se conserva el carrito de la cuenta en el servidor y se cambia al respaldo local del visitante. LocalStorage utiliza claves separadas por cuenta.

`/admin/carritos` está disponible para administradores, vendedores y supervisores. Un carrito con productos se muestra como abandonado después de 24 horas sin modificaciones. Consultarlo no reinicia ese plazo. El panel muestra hasta 200 carritos recientes. Para carritos activos calcula precios actuales; los confirmados/actualizados muestran el total guardado durante la revisión.

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

### Pedidos anteriores

El módulo Pedidos conserva el historial generado antes del cambio de flujo. Los nuevos envíos y sus revisiones se gestionan en Carritos.

### Conexiones de producción

La aplicación reutiliza un único pool MySQL por proceso, también en producción (máximo 10 conexiones, hasta 2 inactivas). La sincronización guarda cambios del carrito de inmediato y consulta revisiones cada 15 segundos mientras la ventana está visible. Al volver a la ventana refresca el carrito.

Para comprobar las pantallas autenticadas y el límite de conexiones con la BD remota, iniciar el build con `pnpm start --port 3100` y ejecutar `node --env-file=.env.local scripts/test-production-db.mjs`. Crea y elimina una cuenta, sesión y carrito temporales. Tras desplegar esta corrección se debe reiniciar el proceso Node para liberar los pools del proceso anterior.

### Preparación de productos durante la revisión

La edición de carritos usa botones +/− y papelera. Cada línea guarda `reserved` como booleano dentro de `productos_confirmados`, sin migración adicional. “Reservado” bloquea unidades para otros clientes sin descontar el stock físico. Para marcarla se exige disponibilidad descontando las reservas de otros carritos. Las líneas agregadas sin reserva pueden superar el stock actual para esperar un ingreso; la búsqueda permite agregar productos activos sin stock. Cambiar una cantidad desde el editor desmarca esa línea. El cliente ve Reservado/Pendiente y las cantidades revisadas se conservan al consultar.

### Reservas de stock
Aplicar `node --env-file=.env.local scripts/migrate-stock-reservations.mjs` antes de desplegar. Crea `carrito_reservas` y convierte las marcas previas si hay stock suficiente; ante una sobreasignación revierte la conversión. La disponibilidad del catálogo y la validación de carritos excluyen las reservas. Las operaciones bloquean las filas de productos dentro de una transacción para evitar reservar las mismas unidades dos veces. Administración puede conservar/reducir reservas propias, liberar líneas o dejarlas pendientes; si el cliente modifica su carrito se liberan sus reservas y vuelve a revisión. Modificar stock físico por debajo de lo reservado se rechaza. El cierre de venta queda pendiente.

Prueba de reservas concurrentes: con el build ejecutándose en el puerto 3100, usar `node --env-file=.env.local scripts/test-stock-reservations.mjs`. Crea un producto con 5 unidades y dos cuentas/carritos temporales; comprueba que solo uno pueda reservar 4, que otro cliente disponga de 1 y que liberar la reserva restaure la disponibilidad, sin alterar el stock físico. Elimina todos sus registros al terminar.
