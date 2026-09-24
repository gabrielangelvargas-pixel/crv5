# Prompt base para nuevos desarrollos

Usá este documento como punto de partida para crear una aplicación web moderna desde cero. No asumas nombres de negocio, módulos, roles, rutas, diseños visuales, dominios, proveedores de hosting ni estructuras heredadas de otro proyecto.

## Principios

- Definir primero el dominio, los actores, los casos de uso y los límites de seguridad.
- Mantener separadas la interfaz, la lógica de negocio, la autenticación, la autorización y el acceso a datos.
- Preferir una implementación simple, tipada, testeable y fácil de desplegar.
- No incorporar dependencias, módulos o configuraciones que no sean necesarios para el producto definido.
- Documentar decisiones relevantes y evitar acoplar la aplicación a un proveedor específico cuando no sea necesario.

## Stack tecnológico base

### Aplicación

- Node.js 20 LTS o la versión LTS vigente al iniciar el proyecto.
- Next.js estable compatible con el proyecto.
- React estable compatible con Next.js.
- TypeScript en modo estricto.
- App Router.
- Server Components por defecto.
- Client Components únicamente cuando se necesite interacción, estado local o APIs del navegador.
- ESLint y formateo consistente.

### Interfaz

- CSS propio como base visual.
- Incorporar Bootstrap, Tailwind u otra librería únicamente si el producto lo justifica.
- Diseño responsive y mobile-first.
- Componentes accesibles: etiquetas, foco visible, navegación por teclado, contraste suficiente y mensajes de error claros.
- Usar una librería de iconos consistente cuando se necesiten iconos.
- No fijar una identidad visual, paleta, tipografía o layout sin una definición explícita del producto.

### Datos y servidor

- Elegir una base de datos relacional o documental según el dominio; usar MySQL 8 compatible cuando se requiera una base relacional tradicional.
- Usar el driver oficial o de referencia del motor elegido.
- Usar un ORM tipado, como Drizzle ORM, cuando aporte valor en esquema, relaciones y migraciones.
- Validar toda entrada externa con Zod o una herramienta equivalente.
- Usar consultas parametrizadas.
- Validar autenticación y autorización antes de leer o modificar datos protegidos.

### Formularios y estado

- React Hook Form para formularios con interacción o validación compleja.
- Zod como fuente compartida de validación cuando sea conveniente.
- TanStack Query para datos remotos, caché, invalidación y estados de carga/error.
- React Context solamente para estado transversal pequeño y estable.
- No colocar todo el estado de la aplicación en un Context global.

## Arquitectura inicial

Usar una estructura que mantenga claros los límites del sistema. Adaptar nombres y carpetas al dominio real:

```text
project/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  └─ (rutas de la aplicación)
│  ├─ components/
│  ├─ features/
│  ├─ contexts/
│  ├─ hooks/
│  ├─ lib/
│  └─ server/
│     ├─ db/
│     ├─ auth/
│     ├─ permissions/
│     └─ services/
├─ public/
├─ database/
│  ├─ migrations/
│  └─ seeds/
├─ tests/
├─ docs/
├─ scripts/
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ README.md
```

Si el proyecto necesita un monorepo, agregar `apps/` y `packages/` solamente cuando exista una necesidad real de compartir aplicaciones o librerías.

## Variables de entorno

Nunca guardar secretos en Git. Crear un `.env.example` sin valores sensibles y documentar cada variable:

```env
NODE_ENV=development
PORT=3000
APP_ORIGIN=http://localhost:3000

DATABASE_URL=
DATABASE_SSL=false

SESSION_SECRET=
```

Los nombres deben adaptarse al proveedor y al motor elegidos. Las variables de producción se configuran fuera del repositorio.

## Autenticación y sesiones

- Definir explícitamente si el producto necesita cuentas, invitados o ambos.
- Almacenar contraseñas únicamente como hashes seguros, preferentemente Argon2id o scrypt.
- Nunca guardar contraseñas en texto plano.
- Usar sesiones del lado del servidor cuando se requiera revocación, control centralizado o datos sensibles.
- Guardar en la base únicamente el hash del token de sesión.
- Usar cookies `httpOnly`, `secure` en producción, `sameSite` apropiado y `path=/`.
- Permitir cerrar la sesión actual y, cuando el producto lo requiera, revocar todas las sesiones activas.
- Verificar usuario activo, sesión vigente y revocación en cada request protegido.
- No guardar tokens sensibles en `localStorage`.
- No confiar en información de identidad enviada por el navegador.

## Autorización

- Definir roles y permisos a partir de los casos de uso reales del proyecto.
- Aplicar autorización en el servidor y en cada endpoint, acción de servidor o mutación.
- Ocultar acciones no permitidas en la interfaz solo como mejora de experiencia, nunca como seguridad.
- Devolver únicamente los campos que el usuario actual necesita.
- Separar permisos de lectura, creación, edición, eliminación y administración cuando corresponda.
- Registrar acciones sensibles y cambios administrativos.
- Probar explícitamente accesos permitidos y denegados para cada rol.

## Modelo de datos y migraciones

- La base de datos es la fuente de verdad del sistema.
- Diseñar entidades, relaciones, restricciones, índices y reglas de integridad antes de implementar pantallas complejas.
- Usar migraciones versionadas e incrementales.
- No modificar manualmente producción sin dejar una migración o registro equivalente.
- Usar transacciones para operaciones que deban ser atómicas.
- Agregar índices para claves foráneas, búsquedas frecuentes, estados y fechas.
- Usar seeds reproducibles solo para datos de desarrollo o demostración.
- Mantener separados los datos públicos, operativos y sensibles cuando el dominio lo requiera.
- Si se migra desde un sistema existente, registrar el esquema actual como baseline y crear solamente migraciones posteriores.

## PWA

- Incluir manifest, iconos y metadatos necesarios para instalación.
- Implementar Service Worker solamente si el producto necesita instalación, caché u operación offline.
- Versionar los nombres de caché y eliminar cachés antiguas al activar una nueva versión.
- No servir HTML ni datos dinámicos obsoletos sin una estrategia explícita.
- Configurar actualización del Service Worker y recuperación ante nuevas publicaciones.
- Probar instalación, actualización, navegación online y el alcance real del modo offline.

## Navegación y experiencia

- Usar navegación cliente cuando corresponda para evitar recargas innecesarias.
- Mantener un estado de sesión consistente durante la navegación.
- Evitar mostrar una pantalla de login mientras todavía se está verificando una sesión válida.
- Usar estados de carga, error, vacío y éxito en las vistas relevantes.
- Hacer que el botón volver tenga un comportamiento predecible.
- No duplicar páginas para cada tamaño de pantalla; usar layout responsive y componentes adaptables.
- Definir límites claros entre rutas públicas, autenticadas y administrativas.

## Seguridad operativa

- Usar HTTPS en todos los entornos accesibles públicamente.
- Aplicar rate limiting en autenticación, registro y endpoints sensibles.
- Configurar headers de seguridad adecuados.
- Validar tamaño, tipo y formato de todos los inputs.
- Evitar mensajes de error que revelen credenciales, consultas o estructura interna.
- No usar `SELECT *` en respuestas públicas o sensibles.
- Mantener secretos fuera del repositorio y rotarlos cuando corresponda.
- Configurar backups y probar restauraciones periódicamente.
- Revisar dependencias y corregir vulnerabilidades antes de publicar.

## Calidad y flujo de trabajo

- Crear pruebas unitarias para lógica crítica.
- Crear pruebas de integración para autenticación, autorización y operaciones de datos.
- Agregar pruebas end-to-end para los flujos principales del producto.
- Ejecutar lint, typecheck, tests y build antes de integrar cambios.
- Revisar migraciones y permisos antes de desplegar.
- Mantener README, documentación técnica y variables de entorno actualizados.
- Evitar refactors amplios cuando no sean necesarios para la funcionalidad solicitada.

## Ramas y despliegue

- Usar una rama de integración o pruebas y una rama de producción, con nombres definidos por el equipo.
- Mantener ambientes separados y sus variables de entorno aisladas.
- No asumir un proveedor de hosting: documentar el proveedor elegido, su runtime, comandos y restricciones.
- Definir explícitamente:
  - versión de Node.js;
  - gestor y versión de paquetes;
  - comando de instalación;
  - comando de lint, test y build;
  - comando de inicio;
  - directorio de salida;
  - variables de entorno;
  - estrategia de migraciones;
  - rollback.
- Ejecutar primero las validaciones en el ambiente de pruebas.
- Crear backup antes de migraciones productivas.
- Verificar logs, health checks y rutas críticas después del despliegue.

## Prompt operativo reutilizable

```text
Creá una aplicación web desde cero usando Node.js LTS, Next.js estable, React, TypeScript estricto y App Router.

No reutilices nombres, rutas, módulos, estilos, dominios, configuraciones, variables de entorno, datos ni decisiones de otro proyecto. Primero analizá el dominio que te describa y proponé una estructura mínima coherente con sus casos de uso.

Usá Server Components por defecto y Client Components únicamente cuando sean necesarios. Mantené separadas la interfaz, los componentes, la lógica de negocio, la autenticación, la autorización y el acceso a datos.

Elegí una base de datos adecuada al dominio. Si se usa una base relacional, implementá esquema tipado, migraciones versionadas, restricciones, índices, consultas parametrizadas y transacciones. Validá todas las entradas externas con Zod o una alternativa equivalente.

Implementá autenticación segura solamente si el producto la necesita: contraseñas con Argon2id o scrypt, sesiones revocables, cookies seguras y ningún secreto en el navegador o en el repositorio. Definí roles y permisos a partir de los requisitos reales y aplicá la autorización en el servidor en cada endpoint y mutación.

Construí una interfaz responsive y accesible, sin imponer una identidad visual, paleta, layout o componente de otro sistema. Incluí estados de carga, error, vacío y éxito donde corresponda.

Incorporá capacidades PWA únicamente si forman parte del alcance. Configurá manifest, Service Worker, actualización y caché de forma explícita para evitar datos obsoletos.

Prepará documentación, `.env.example`, pruebas, lint, typecheck, build y despliegue reproducible. No inventes un proveedor, dominio, base de datos, módulo o credencial: dejá un placeholder o pedí la definición cuando sea necesaria.

Antes de terminar cada cambio ejecutá las validaciones disponibles, revisá los límites de seguridad, verificá las migraciones y documentá las decisiones importantes.
```
