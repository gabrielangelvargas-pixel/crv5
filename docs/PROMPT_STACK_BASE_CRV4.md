# Prompt maestro: stack base para nuevos desarrollos

Usá este documento como contexto inicial para crear una aplicación web progresiva moderna desde una base limpia.

## Objetivo

Construir una plataforma web responsive y mobile-first para catálogo, cuentas de usuario, carrito, pedidos, ventas, stock y administración interna.

La aplicación debe tener una zona pública para clientes y una zona privada protegida por autenticación, roles y permisos.

## Stack tecnológico

### Aplicación

- Node.js 20 o superior.
- Next.js 16 o la última versión estable compatible.
- React 19 o la última versión estable compatible.
- TypeScript estricto.
- App Router de Next.js.
- Server Components por defecto.
- Client Components solamente cuando se necesite interacción, estado local o APIs del navegador.
- ESLint.

### Interfaz

- Bootstrap 5 como base de utilidades y componentes.
- CSS propio para identidad visual y responsive design.
- Diseño mobile-first.
- Interfaz accesible: etiquetas, foco visible, navegación por teclado, estados de carga y mensajes de error.
- Evitar tarjetas decorativas innecesarias y priorizar interfaces claras, densas y fáciles de escanear.
- Usar iconos reconocibles en botones y agregar `aria-label` cuando el icono no sea suficiente.

### Datos y backend

- MySQL 8 o compatible con MySQL de Hostinger.
- `mysql2` para conexión y consultas SQL parametrizadas.
- Drizzle ORM para esquema tipado, relaciones y migraciones nuevas.
- Zod para validar todos los datos provenientes del cliente, URL, formularios y APIs.
- Nunca concatenar valores del usuario en SQL.
- Las rutas de servidor deben validar autenticación y autorización antes de consultar o modificar datos sensibles.

### Formularios y estado

- React Hook Form para formularios complejos.
- Zod como resolver y fuente única de validación.
- TanStack Query para datos remotos, caché, invalidación y estados de carga/error.
- React Context solamente para estado transversal pequeño y estable, por ejemplo:
  - Usuario autenticado.
  - Carrito activo.
  - Preferencias globales.
- No colocar toda la información de la aplicación en un Context global.

### PWA

- Manifest generado por Next.js.
- Service Worker propio o solución PWA compatible con Next.js.
- Iconos de 192x192 y 512x512.
- Cache de shell y recursos estáticos.
- Las rutas HTML y las APIs deben usar estrategia de red adecuada para evitar mostrar datos obsoletos.
- El Service Worker debe usar una versión de caché identificable y eliminar caches anteriores al activarse.
- Registrar actualizaciones del Service Worker con `updateViaCache: "none"`.
- Probar instalación, actualización, navegación offline limitada y recuperación después de publicar una nueva versión.

## Arquitectura recomendada

```text
project/
├─ apps/
│  └─ web/
│     ├─ public/
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ api/
│     │  │  ├─ catalogo/
│     │  │  ├─ carrito/
│     │  │  ├─ historial/
│     │  │  ├─ login/
│     │  │  ├─ perfil/
│     │  │  ├─ panel/
│     │  │  └─ registro/
│     │  ├─ components/
│     │  ├─ contexts/
│     │  └─ server/
│     │     ├─ db/
│     │     ├─ auth.ts
│     │     ├─ permissions.ts
│     │     └─ password.ts
│     ├─ drizzle.config.ts
│     ├─ package.json
│     └─ tsconfig.json
├─ database/
│  └─ seeds/
├─ docs/
├─ public/
├─ scripts/
├─ package.json
└─ README.md
```

Para un proyecto pequeño también se puede usar `apps/web` como raíz única, pero se debe mantener la separación entre UI, servidor, base de datos y documentación.

## Variables de entorno

Nunca guardar secretos en Git. Crear `.env.example` sin valores sensibles:

```env
NODE_ENV=development
PORT=3000
APP_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=app_staging
DB_USER=app_user
DB_PASSWORD=
DB_SSL=false
```

En producción, las variables se configuran en Hostinger o en el proveedor de despliegue.

## Autenticación

- Usuarios identificados por nombre de usuario o email según el dominio del proyecto.
- Contraseñas almacenadas únicamente como hashes `scrypt` o Argon2id.
- Nunca guardar contraseñas en texto plano.
- Sesiones almacenadas en MySQL.
- La cookie de sesión debe ser:
  - `httpOnly`.
  - `secure` en producción.
  - `sameSite: "lax"` como mínimo.
  - `path: "/"`.
  - Con expiración persistente únicamente si el producto lo requiere.
- Guardar en BD solo el hash del token de sesión, nunca el token original.
- Permitir cerrar la sesión actual y todas las sesiones activas.
- Revocar sesiones mediante una marca `revocada_en`.
- Validar usuario activo y sesión no revocada/no vencida en cada request protegido.
- No confiar en roles enviados por el navegador.

## Roles y permisos

Roles base:

- `admin`: acceso total.
- `supervisor`: gestión operativa según permisos.
- `vendedor`: clientes, pedidos y ventas; nunca costos ni márgenes.
- `cliente`: catálogo, carrito, pedidos propios, perfil e historial propio.

Reglas obligatorias:

1. La autorización se valida en el servidor, no solamente ocultando enlaces.
2. Un cliente nunca puede acceder al panel administrativo.
3. Un vendedor nunca puede recibir campos sensibles como costo, margen o rentabilidad.
4. Cada módulo debe declarar permisos de lectura, creación, edición, eliminación y administración.
5. Las APIs deben devolver únicamente los campos permitidos para el rol actual.
6. La interfaz puede ocultar acciones no autorizadas, pero eso es solo una mejora de UX, no una medida de seguridad.

## Módulos públicos

- Home/Inicio.
- Catálogo.
- Detalle de rubro y subrubro.
- Detalle de producto.
- Carrito.
- Login.
- Registro.
- Perfil/Mi cuenta.
- Historial de compras.

## Módulos administrativos

El panel debe ser modular y mostrar solamente los módulos autorizados.

Orden sugerido:

1. Rubros y subrubros.
2. Productos y variantes.
3. Clientes.
4. Pedidos.
5. Ventas.
6. Stock.
7. Usuarios, roles y permisos.
8. Notificaciones internas.
9. Auditoría.

## Modelo comercial

### Productos

El diseño debe contemplar desde el principio:

- Productos con variantes.
- Precio de venta.
- Precio de oferta.
- Fecha de inicio y fin de oferta.
- Costos y campos sensibles separados de los datos públicos.
- Precios escalonados por cantidad.
- Stock por producto o variante.
- Estado activo, publicado y disponible.

El precio vigente debe calcularse en servidor considerando fechas y reglas de cantidad. No confiar en el precio enviado por el navegador.

### Carrito

- El cliente puede agregar y quitar productos.
- Validar existencia, disponibilidad, variante, precio vigente y stock al confirmar.
- El total mostrado en el cliente es informativo.
- El total definitivo se recalcula en el servidor.

### Pedido y venta

Flujo sugerido:

```text
carrito
  -> pedido pendiente de revisión
  -> pedido modificado por administración
  -> pendiente de aceptación del cliente
  -> aceptado
  -> convertido en venta
  -> stock descontado dentro de una transacción
```

Estados iniciales recomendados para pedidos:

- `borrador`
- `pendiente_revision`
- `en_revision`
- `pendiente_aceptacion`
- `aceptado`
- `rechazado`
- `cancelado`
- `convertido_venta`

Estados iniciales recomendados para ventas:

- `creada`
- `preparando`
- `lista_para_entrega`
- `entregada`
- `cancelada`
- `devuelta`

La conversión de pedido a venta y el descuento de stock deben ejecutarse en una transacción SQL. Si una parte falla, toda la operación debe revertirse.

## Notificaciones

Primera etapa:

- Notificaciones internas almacenadas en BD.
- Bandeja de notificaciones por usuario.
- Estado leída/no leída.

Etapa posterior:

- Web Push.
- Notificaciones de cambios de pedido.
- Avisos de stock y ventas.

## Seguridad de datos

- Separar campos públicos y sensibles en consultas distintas.
- No enviar costos al cliente ni al vendedor.
- No devolver filas completas con `SELECT *` en APIs públicas.
- Usar consultas parametrizadas.
- Validar tamaño, formato y tipo de todos los inputs.
- Aplicar rate limit en login, registro y endpoints sensibles.
- Usar headers de seguridad y HTTPS.
- Registrar auditoría de cambios administrativos.
- Evitar mensajes de error que revelen estructura interna o credenciales.
- Realizar backups automáticos y probar restauraciones.

## Base de datos y migraciones

- La base de datos es la fuente de verdad.
- Staging y producción deben tener bases separadas cuando el sistema ya esté operativo.
- Para una migración desde un sistema anterior, marcar el esquema existente como baseline.
- No ejecutar migraciones iniciales de una base limpia sobre una base que ya contiene tablas.
- Las migraciones posteriores deben ser incrementales, reversibles cuando sea posible y revisadas antes de producción.
- Usar transacciones para cambios de datos relacionados.
- Crear índices para claves foráneas, búsquedas por slug, estado, orden y fechas.

## Navegación y experiencia

- Usar navegación cliente de Next.js para evitar recargas y parpadeos.
- Mantener el contexto de usuario durante la navegación.
- Mostrar estados de carga consistentes.
- Evitar redirigir a login antes de terminar de verificar la sesión.
- Usar `router.replace` después de login/logout cuando corresponda.
- No duplicar páginas completas para desktop y móvil; adaptar mediante CSS y componentes responsivos.
- El botón volver debe tener una navegación predecible y no obligar al usuario a recorrer estados internos innecesarios.

## Despliegue en Hostinger

Ramas:

- `staging`: pruebas.
- `main`: producción.

Configuración recomendada para una aplicación ubicada en `apps/web`:

- Framework: Next.js.
- Directorio raíz: `apps/web`.
- Gestor de paquetes: npm.
- Comando de compilación: `npm run build`.
- Directorio de salida: `.next`.
- Node.js: 20.x o superior.
- Variables de entorno cargadas desde el panel de Hostinger.
- Despliegue automático desde GitHub.

Comandos locales:

```bash
cd apps/web
npm ci
npm run lint
npm run build
npm run dev
```

Si Hostinger ejecuta comandos desde la raíz del repositorio, configurar scripts equivalentes:

```json
{
  "scripts": {
    "build": "npm --prefix apps/web ci && npm --prefix apps/web run build",
    "start": "npm --prefix apps/web run start"
  }
}
```

Antes de pasar a `main`:

1. Verificar lint y build.
2. Probar login, registro, logout y protección de roles.
3. Probar PWA instalada y actualización del Service Worker.
4. Probar APIs sin sesión y con roles diferentes.
5. Ejecutar migraciones de staging.
6. Verificar logs de runtime.
7. Crear backup.
8. Integrar staging en main.

## Prompt operativo para el agente de desarrollo

```text
Construí este proyecto usando Next.js, React, TypeScript estricto, App Router, Bootstrap 5, CSS propio mobile-first, MySQL, mysql2, Drizzle ORM, Zod, React Hook Form, TanStack Query y PWA.

Usá Server Components por defecto y Client Components solo cuando sean necesarios. Mantené separadas la interfaz, la lógica de servidor, la autenticación, la autorización y el acceso a datos.

Implementá autenticación segura con sesiones persistentes en MySQL, cookies httpOnly, contraseñas con scrypt o Argon2id y revocación de sesiones. Aplicá autorización en cada endpoint; nunca confíes en roles enviados por el navegador.

Usá los roles admin, supervisor, vendedor y cliente. Un cliente nunca puede acceder al panel administrativo. Un vendedor puede gestionar clientes, pedidos y ventas, pero nunca debe recibir costos, márgenes ni campos sensibles.

Validá todos los inputs con Zod y usá SQL parametrizado. No uses SELECT * en APIs públicas. Recalculá precios, totales y stock en el servidor. Convertí pedidos en ventas y descontá stock dentro de transacciones.

Construí primero una base funcional y segura: layout, PWA, autenticación, autorización, usuarios, rubros/subrubros, productos, carrito, pedidos, ventas y stock. Cada módulo debe tener estados de carga, error, vacío y éxito, y debe ser responsive.

Prepará despliegue en Hostinger con Node 20, rama staging para pruebas y main para producción. La aplicación vive en apps/web, usa npm run build, salida .next y variables de entorno configuradas fuera de Git.

Antes de terminar cada cambio ejecutá lint y build, revisá los permisos, verificá que no se filtren datos sensibles y dejá documentadas las migraciones y decisiones importantes.
```
