# CRV4

Catálogo mayorista y gestión de carritos/pedidos de CRV4 (crv4mayorista.com.ar).

## Stack

- Node.js 24 y pnpm 10
- Next.js 15.5 (App Router) y React 19
- TypeScript estricto y Tailwind CSS 4
- MySQL vía `mysql2` (sin ORM), validación con Zod
- ESLint, Prettier, Vitest y Playwright

## Primer uso

```bash
pnpm install
cp .env.example .env.local   # completar las variables de base de datos
pnpm db:migrate
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts

```bash
pnpm dev          # Servidor local
pnpm build        # Build de producción
pnpm start        # Ejecuta el build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript sin emitir archivos
pnpm format       # Verifica formato
pnpm test         # Tests unitarios (Node) y de componentes (jsdom)
pnpm test:e2e     # Tests end-to-end
pnpm validate     # Lint + typecheck + tests + build
pnpm db:migrate   # Aplica las migraciones pendientes
pnpm db:status    # Lista migraciones aplicadas y pendientes
```

## Despliegue

Hostinger despliega automáticamente cada push a `main`. Antes de hacer push:

1. `pnpm validate`.
2. Si el cambio agrega una migración, ejecutar `pnpm db:migrate` contra la base de producción justo antes del push. Los scripts que renombran columnas deben correr con poco tráfico: el código anterior deja de funcionar con el esquema nuevo hasta que termine el despliegue.
3. Tras desplegar, verificar que el proceso Node se haya reiniciado, para que se libere el pool MySQL del proceso anterior.

Variables de entorno (ver `.env.example`):

- `DATABASE_*`: conexión MySQL.
- `NEXT_PUBLIC_SITE_URL`: URL pública, usada en metadatos y sitemap.
- `NEXT_PUBLIC_ASSETS_BASE_URL`: carpeta del servidor con las imágenes (`productos/`, `categorias/`, `portadas/`), servidas por `/api/media`; o una URL `https://` si las sirve otro host. Si está vacía se usan las de `public/`.

## Migraciones

`scripts/migrate.mjs` aplica en orden los scripts de la lista `MIGRATIONS` que todavía no figuran en la tabla `schema_migrations`, y registra cada uno al terminar. Si uno falla se detiene sin aplicar los siguientes. Para una migración nueva: crear `scripts/migrate-<nombre>.mjs` (idempotente) y agregarlo al final de la lista; nunca reordenar.

`node --env-file=.env.local scripts/migrate.mjs --baseline` marca todas como aplicadas sin ejecutarlas; sirve solo para una base que ya tiene el esquema completo.

## Estructura

```text
src/
  app/         Rutas, layouts, páginas y Route Handlers (API)
  components/  Componentes de UI
  config/      Configuración tipada de entorno
  data/        Tipos de dominio
  lib/         Repositorios (acceso a MySQL) y lógica de dominio
  test/        Setup de tests
scripts/       Migraciones y pruebas de integración contra la base
database/      Esquemas SQL de referencia
e2e/           Tests end-to-end
```

## Convenciones

- Server Components por defecto; Client Components solo para interacción, estado local o APIs del navegador.
- Lógica de dominio y SQL en `src/lib`, no en `app/`.
- Roles solo a través de `isAdministrator` / `canAccessAdmin` (`src/lib/authorization.ts`).
- Ejecutar `pnpm validate` antes de integrar cambios.

## Rendimiento y caché

- **Catálogo y categorías** se cachean entre requests (`unstable_cache`, tag `catalog`, renovación cada 5 minutos). Las rutas de Administración → Productos/Categorías invalidan la caché al guardar. Cambios hechos directamente en la base tardan hasta 5 minutos en verse.
- **Stock disponible**: el catálogo cacheado guarda el stock físico; las reservas se restan en cada request con una sola consulta.
- **El navegador no recibe el catálogo completo.** `/api/cart` devuelve solo los productos del carrito y la búsqueda del navbar usa `/api/products/search`.
- **Carrito**: los cambios se guardan de inmediato con `POST /api/cart` (transacción con bloqueos). Las consultas periódicas, cada 15 segundos con la ventana visible, usan `GET /api/cart`: sin transacción ni bloqueos y con ETag (responde 304 si nada cambió). Si el stock bajó, el cliente ajusta la cantidad y la guarda con un POST.
- **Sesión**: `getCurrentUser` se resuelve una vez por request. El login limita los intentos fallidos (8 por cuenta e IP y 40 por IP cada 15 minutos) y borra en lotes las sesiones vencidas.
- **Imágenes**: al subir una imagen se guarda con `?v=<hash>`; esas URLs se cachean un año. Las URLs sin versión se revalidan con ETag.
- **Service worker** (`public/sw.js`): cachea solo archivos de build e imágenes; nunca `/api/*` ni páginas.
- **MySQL**: un único pool por proceso (máximo 10 conexiones, hasta 2 inactivas).

## Funcionalidad

### Carritos persistentes

El servidor guarda variantes y cantidades, valida el stock y controla la versión del carrito. Los visitantes usan una cookie HttpOnly de 180 días; los clientes recuperan el carrito de su cuenta. Al iniciar sesión se fusiona el carrito anónimo una sola vez. Al cerrar sesión se conserva el carrito de la cuenta en el servidor y se cambia al respaldo local del visitante. LocalStorage utiliza claves separadas por cuenta.

`/admin/carritos` está disponible para administradores, vendedores y supervisores. Un carrito con productos se muestra como abandonado después de 24 horas sin modificaciones. Consultarlo no reinicia ese plazo. El panel muestra hasta 200 carritos recientes. Para carritos activos calcula precios actuales; los confirmados/actualizados muestran el total guardado durante la revisión.

### Carritos confirmados y revisión administrativa

Desde `/carrito/confirmar` el cliente inicia sesión o se registra (sesión persistente de 30 días) y envía su carrito. El mismo registro queda `confirmado`, mantiene propietario y productos y no genera pedidos. No hay mínimo y no reserva ni descuenta stock. La antigua ruta `/pedido/confirmar` redirige al carrito; la API de creación de pedidos responde 410.

En Administración → Carritos se editan cantidades, se quitan productos y se agregan variantes buscando por nombre o código. Guardar verifica la versión y los precios y deja el carrito `actualizado`. El cliente recibe una notificación y ve los cambios y el total guardado. Puede volver a comprar o aceptar la revisión con Confirmar & Pagar. Si modifica los productos vuelve a `activo` y debe enviarlo nuevamente. Consultarlo no altera el estado. Los pedidos anteriores permanecen como historial.

### Preparación de productos durante la revisión

La edición de carritos usa botones +/− y papelera. Cada línea guarda `reserved` como booleano dentro de `productos_confirmados`. “Reservado” bloquea unidades para otros clientes sin descontar el stock físico. Para marcarla se exige disponibilidad descontando las reservas de otros carritos. Las líneas agregadas sin reserva pueden superar el stock actual para esperar un ingreso; la búsqueda permite agregar productos activos sin stock. Cambiar una cantidad desde el editor desmarca esa línea. El cliente ve Reservado/Pendiente y las cantidades revisadas se conservan al consultar.

Los carritos confirmados y actualizados abren directamente sus tarjetas editables. Cada línea permite marcar Reservado o Agotado. Agotado se guarda en `productos_confirmados`, conserva su cantidad como historial, libera reservas y se excluye de items, unidades e importe. Esta marca corresponde a esa línea del carrito, no cambia el stock físico ni agota el producto para todo el catálogo. Los cambios se aplican al guardar.

Ajustes del carrito: debajo del subtotal, administración puede agregar hasta 50 conceptos con descripción e importe positivo o negativo, expresado en centavos para el cálculo. Se persisten en `carritos.ajustes` y se muestran al cliente junto al total a pagar. La API rechaza conceptos incompletos y totales negativos. Los ajustes se conservan cuando el cliente modifica sus productos.

### Reservas de stock

`carrito_reservas` guarda las unidades reservadas por carrito. La disponibilidad del catálogo y la validación de carritos excluyen las reservas. Las operaciones bloquean las filas de productos dentro de una transacción para evitar reservar las mismas unidades dos veces. Administración puede conservar/reducir reservas propias, liberar líneas o dejarlas pendientes; si el cliente modifica su carrito se liberan sus reservas y vuelve a revisión. Modificar stock físico por debajo de lo reservado se rechaza. El cierre de venta queda pendiente.

### Aceptación de revisión

Al guardar la revisión se notifica al propietario en su campana. Seguir comprando vuelve a activo y libera reservas. Confirmar & Pagar valida propietario, versión, importe revisado y disponibilidad; crea un único pedido `esperando_pago` con productos, historial agotado, entrega y ajustes, y reserva las líneas disponibles. Conserva el carrito como confirmado con `pedido_id`, libera su espacio de cuenta para nuevas compras y avisa a administradores/vendedores activos. No descuenta stock físico ni registra un pago: el equipo coordina las instrucciones por WhatsApp. El carrito asociado a un pedido ya no puede editarse desde Carritos. Los reintentos devuelven el pedido existente sin duplicar avisos ni reservas.

### Notificaciones internas

Cada envío de un carrito a revisión crea, en la misma transacción, un aviso por administrador/vendedor activo; roles duplicados y reintentos no generan avisos duplicados. Un nuevo envío después de modificar el carrito sí genera un aviso nuevo. La campana muestra el total sin leer, los últimos 50 avisos y un enlace que abre el carrito correspondiente. La lectura es independiente por usuario. Se consulta cada 30 segundos solo con la app visible; no envía push ni correo.

La campana permite activar/silenciar un sonido breve (con prueba al activarlo). Solo suena por IDs de avisos nuevos no leídos después de la carga inicial; no repite avisos antiguos al abrir el panel. La preferencia se guarda por usuario en el navegador. El navegador necesita una interacción para habilitar audio.

### Pedidos

El módulo Pedidos conserva el historial generado antes del cambio de flujo. Los nuevos envíos y sus revisiones se gestionan en Carritos.

Numeración: cada pedido tiene un número correlativo (`pedidos.numero`, contador en `pedido_numeracion`) que se consume solo al confirmar la transacción; los cancelados conservan su número. Un trigger impide pedidos vacíos que no estén cancelados. No eliminar pedidos del historial para mantener la correlación.

Costos: `productos.precio_costo` es editable en Administración → Productos. El JSON del pedido guarda codigo, variante, descripcion, cantidad, precio_costo, precio_venta, subtotal_costo y subtotal_venta; incluye producto_id y nombre para identificar la variante y preservar su nombre. Excluye agotados. Los importes se calculan en centavos. Los ajustes afectan solo `total_venta`; `total_costo` = `subtotal_costo`. Los costos son visibles solo para administración y no se envían al cliente.

Entrega: `pedidos.entrega` es una FK a `usuarios_direcciones.id`, validada contra el propietario del pedido; queda NULL para retiro. Modalidad, teléfono y observaciones se guardan por separado. El checkout selecciona direcciones activas guardadas. La FK impide borrar direcciones vinculadas a pedidos; las modificaciones de esa dirección se reflejan al consultar el pedido.

## Pruebas de integración contra la base

Requieren las variables de `.env.local`. Crean registros temporales y los eliminan al terminar. Las que usan HTTP necesitan la app en el puerto 3100 (`pnpm dev --port 3100`, o `pnpm build` y `pnpm start --port 3100`).

| Script | Verifica |
| --- | --- |
| `scripts/test-cart-integration.mjs` | Carrito persistente; requiere un producto activo con 5+ unidades |
| `scripts/test-confirmed-cart-integration.mjs` | Envío a revisión sin crear pedidos ni tocar stock |
| `scripts/test-stock-reservations.mjs` | Reservas concurrentes sobre un producto temporal |
| `scripts/test-cart-notifications.mjs` | Destinatarios, reintentos, permisos y lectura de avisos |
| `scripts/test-cart-adjustments.mjs` | Conceptos y total a pagar |
| `scripts/test-cart-acceptance.mjs` | Confirmar & Pagar y generación del pedido |
| `scripts/test-production-db.mjs` | Pantallas autenticadas y límite de conexiones |
| `scripts/test-order-accounting.mjs` | Contabilidad de pedidos en una transacción revertida (sin app) |

Ejecutar con `node --env-file=.env.local scripts/<script>`.
