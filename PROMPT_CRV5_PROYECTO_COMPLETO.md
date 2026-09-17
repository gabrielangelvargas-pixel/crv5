# Prompt maestro para Codex — Proyecto CRV5

## 1. Rol que debe asumir Codex

Actuá como arquitecto de software y desarrollador senior full-stack especializado en Node.js, aplicaciones PWA, MySQL, seguridad, rendimiento y sistemas de gestión comercial.

Debés trabajar de forma progresiva, ordenada y verificable. Antes de modificar archivos, inspeccioná el proyecto existente, explicá brevemente qué encontraste y proponé los cambios. No borres ni reemplaces trabajo existente sin justificarlo.

El objetivo es construir **CRV5**, la nueva plataforma integral de CRV4 Mayorista.

---

## 2. Contexto comercial

Empresa: **CRV4 Mayorista**.

Actividad: venta mayorista de regalería, bijouterie y accesorios para comercios, revendedores y emprendedores en Argentina.

Sitio principal: `https://crv4mayorista.com`

El sistema debe permitir administrar productos, variantes, precios, stock, clientes, ventas y pedidos desde una única aplicación accesible por internet.

La aplicación deberá funcionar en:

- Computadoras Windows.
- Celulares Android.
- Tablets.
- Navegadores modernos.
- PWA instalable desde Chrome o Edge.

---

## 3. Decisión arquitectónica principal

**Access queda completamente descartado y no se utilizará.**

CRV5 tendrá:

- Una única base de datos MySQL en la nube.
- Una única aplicación Node.js.
- Una API segura como única vía de acceso a la base de datos.
- Una PWA para clientes y personal interno.
- Un sistema de roles y permisos.
- Un solo origen de datos para productos, precios, stock, clientes, ventas y pedidos.

Ningún navegador, celular o computadora cliente debe conectarse directamente a MySQL. Todas las operaciones deben pasar por la API del backend.

Arquitectura general:

```text
Windows / Android / Tablet / Navegador
                  │
                  ▼
          PWA CRV5 en crv4mayorista.com
                  │
                  ▼
              API Node.js
                  │
                  ▼
          MySQL única en la nube
```

La base de datos en la nube será la fuente única de verdad. No implementar sincronización con una base local ni contemplar una segunda base de datos.

---

## 4. Entorno de despliegue

El primer despliegue se realizará en el plan actual Cloud Startup de Hostinger, que permite aplicaciones Node.js y MySQL.

Recursos conocidos del plan:

- 4 núcleos de CPU.
- 4096 MB de RAM.
- 200 GB de almacenamiento.
- 3.000.000 de inodos.
- 300 conexiones simultáneas web.
- 300 procesos máximos.
- 150 PHP workers.
- Ancho de banda sin límites.
- Servidor en Sudamérica, Brasil.
- Compatibilidad con versiones modernas de Node.js.
- Administración de paquetes mediante npm, pnpm o yarn.

No contratar ni requerir un VPS para la primera versión. El código debe quedar preparado para migrar posteriormente a un VPS sin rehacer la aplicación.

No asumir que se pueden ejecutar procesos permanentes, workers ilimitados, Docker o servicios auxiliares en el hosting actual. Detectar sus límites y documentar cualquier restricción real.

---

## 5. Objetivo funcional de CRV5

CRV5 debe tener dos áreas principales dentro de la misma PWA:

### Área pública

Disponible en `https://crv4mayorista.com` sin iniciar sesión:

- Página de inicio.
- Catálogo de productos.
- Rubros y categorías jerárquicas.
- Búsqueda rápida.
- Filtros.
- Productos con variantes y modelos.
- Imágenes de productos.
- Precios mayoristas.
- Precios por cantidad.
- Ofertas vigentes.
- Carrito o pedido.
- Registro e inicio de sesión.
- Envío del pedido.
- Consulta del estado del pedido.

El pedido será inicialmente una solicitud comercial. El importe final podrá ajustarse posteriormente por faltantes, cambios de stock o confirmación por WhatsApp.

### Área privada

Accesible mediante login y permisos:

- Panel general.
- Gestión de productos.
- Gestión de variantes.
- Gestión de rubros y jerarquías.
- Gestión de precios.
- Gestión de precios por cantidad.
- Gestión de ofertas con fecha de inicio y fin.
- Gestión de stock por variante.
- Gestión de clientes.
- Gestión de pedidos.
- Registro de ventas.
- Consulta de pagos.
- Facturación futura o integrada cuando corresponda.
- Usuarios, roles y permisos.
- Auditoría de operaciones.

---

## 6. Roles y permisos

Implementar autorización basada en roles, no solamente ocultando botones en el frontend.

Roles iniciales:

### Cliente

- Ver catálogo publicado.
- Consultar precios permitidos.
- Crear y consultar sus pedidos.
- Modificar sus datos personales.

### Vendedor

- Consultar productos, variantes, precios y stock.
- Registrar ventas.
- Buscar clientes.
- Crear y editar clientes según permiso.
- Crear pedidos internos.
- Consultar pedidos.
- No administrar usuarios ni configuraciones críticas.

### Administrador

- Acceso completo a productos, variantes, precios, stock, clientes, pedidos, ventas y usuarios.
- Administración de roles y permisos.
- Configuración general.
- Auditoría.

### Supervisor

- Consultar reportes y operaciones.
- Autorizar anulaciones, descuentos o modificaciones sensibles según permisos configurables.

Los permisos deben validarse en cada endpoint del backend.

---

## 7. Pantalla de ventas y lector de códigos

Esta es una de las prioridades más importantes del proyecto.

La venta debe estar diseñada para que el operador pueda escanear varios productos rápidamente sin esperar cargas completas de páginas.

Flujo esperado:

```text
Escanear código
       ↓
Buscar producto de forma inmediata
       ↓
Mostrar nombre, variante, precio y cantidad
       ↓
Agregar a la venta
       ↓
Validar stock y precio actuales en la API
       ↓
Confirmar la venta mediante una transacción segura
```

Requisitos de rendimiento:

- La pantalla de ventas debe cargarse una sola vez.
- El lector debe funcionar como entrada de teclado y aceptar códigos enviados con Enter.
- La búsqueda principal debe ser por código exacto.
- Debe existir un endpoint optimizado, por ejemplo:
  `GET /api/ventas/productos-por-codigo/:codigo`
- La respuesta debe incluir en una sola petición el producto, la variante, el precio aplicable, el stock y los datos mínimos necesarios.
- No cargar imágenes durante el escaneo.
- No reconstruir toda la página por cada producto.
- No realizar varias consultas consecutivas para obtener datos relacionados.
- Utilizar índices MySQL para códigos de producto y códigos de variante.
- Utilizar pool de conexiones MySQL.
- Evitar consultas N+1.
- Mantener la pantalla de venta en memoria mientras dure la operación.
- Permitir agregar rápidamente varias unidades del mismo producto.
- Permitir modificar cantidad sin perder el foco del lector.
- Mantener el foco automáticamente en el campo de escaneo.
- Mostrar un indicador pequeño de validación sin bloquear innecesariamente la pantalla.

Se puede utilizar caché local o IndexedDB para acelerar la visualización inicial, pero nunca confiar exclusivamente en datos almacenados localmente para confirmar una venta. Antes de confirmar, el servidor debe validar nuevamente precio, stock, producto activo y permisos.

La confirmación debe utilizar una transacción de base de datos para evitar stock negativo o ventas simultáneas inconsistentes.

---

## 8. Modelo de datos inicial

Revisar primero la estructura existente y adaptar las migraciones sin destruir datos.

Entidades principales previstas:

- `usuarios`
- `roles`
- `permisos`
- `usuarios_roles`
- `roles_permisos`
- `rubros`
- `productos`
- `productos_variantes`
- `productos_precios`
- `productos_variantes_precios`
- `productos_precios_cantidad`
- `stock_variantes` o estructura equivalente
- `clientes`
- `pedidos`
- `pedidos_detalles`
- `ventas`
- `ventas_detalles`
- `pagos`
- `pagos_detalles`
- `facturas`
- `facturas_detalles`
- `auditoria`

La tabla `rubros` debe admitir jerarquías mediante relación padre-hijo:

- Rubro principal.
- Subrubro.
- Nietos o niveles futuros.
- Orden de presentación.
- Estado activo.

Productos y variantes deben contemplar:

- Código de producto.
- Código por variante.
- Nombre.
- Descripción.
- Unidad de venta.
- Imagen.
- Color o modelo.
- Orden.
- Estado activo.
- Publicación en internet.
- Precio base.
- Precio por variante cuando corresponda.
- Precios por cantidad.
- Oferta.
- Fechas de vigencia.
- Stock por variante.
- Fechas de creación y modificación.

Los pedidos deben conservar la variante exacta seleccionada, cantidad, precio aplicado al momento de armar el pedido y estado del pedido.

Estados sugeridos para pedidos:

- `pendiente`
- `en_revision`
- `confirmado`
- `preparando`
- `enviado`
- `completado`
- `cancelado`

No modificar automáticamente el precio histórico de una venta ya confirmada si el precio actual del producto cambia.

---

## 9. Reglas de precios

Implementar una única función de negocio para calcular el precio aplicable.

La prioridad debe ser:

1. Oferta vigente, si corresponde.
2. Precio especial de la variante, si existe.
3. Precio por cantidad aplicable.
4. Precio base del producto.

La regla exacta debe documentarse y ser consistente en catálogo, carrito, pedidos, ventas y API.

No duplicar la lógica de precios en varios controladores o vistas.

Las ofertas deben validar:

- Activa.
- Fecha de inicio.
- Fecha de fin.
- Producto o variante afectada.
- Condiciones de cantidad.
- Permiso del usuario.

---

## 10. API y backend

Usar Node.js con una estructura modular y mantenible. Express puede utilizarse si es compatible con el proyecto existente.

Separar como mínimo:

- Rutas.
- Controladores.
- Servicios de negocio.
- Repositorios o acceso a datos.
- DTOs o validadores de entrada.
- Middleware.
- Autenticación.
- Autorización.
- Configuración.
- Utilidades.
- Logs.

Endpoints iniciales sugeridos:

```text
GET    /api/rubros
GET    /api/productos
GET    /api/productos/:id
GET    /api/productos/codigo/:codigo
GET    /api/productos/:id/variantes
GET    /api/productos/:id/precio
GET    /api/productos/:id/precios-cantidad

POST   /api/auth/registro
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/clientes
POST   /api/clientes
PUT    /api/clientes/:id

GET    /api/pedidos
POST   /api/pedidos
GET    /api/pedidos/:id
PUT    /api/pedidos/:id/estado

GET    /api/ventas/productos-por-codigo/:codigo
POST   /api/ventas/validar
POST   /api/ventas

GET    /api/admin/productos
POST   /api/admin/productos
PUT    /api/admin/productos/:id
DELETE /api/admin/productos/:id
```

Los nombres pueden adaptarse al proyecto existente, pero debe mantenerse una convención uniforme.

Usar validación estricta de datos, respuestas JSON consistentes, códigos HTTP correctos y manejo centralizado de errores.

---

## 11. Seguridad

Implementar como mínimo:

- HTTPS obligatorio.
- Contraseñas con hash seguro, nunca texto plano.
- Sesiones seguras o tokens con expiración correctamente gestionados.
- Cookies `HttpOnly`, `Secure` y `SameSite` cuando se usen sesiones.
- Protección contra CSRF si corresponde al mecanismo de autenticación.
- Validación de permisos en backend.
- Rate limiting para login, registro y endpoints sensibles.
- Validación de entradas.
- Protección contra SQL injection mediante consultas parametrizadas.
- Protección XSS.
- CORS restrictivo.
- Cabeceras de seguridad.
- Content Security Policy cuando sea viable.
- Secretos únicamente mediante variables de entorno.
- No subir contraseñas, tokens ni archivos `.env` al repositorio.
- Auditoría de operaciones críticas.
- Validación de archivos e imágenes subidas.
- Control de tamaño y tipo de archivos.
- No exponer información interna en mensajes de error.
- Backups y procedimiento documentado de restauración.

La contraseña `root` del VPS o cualquier credencial de Hostinger nunca debe incluirse en el código ni solicitarse dentro del repositorio.

---

## 12. PWA

La aplicación debe incluir:

- `manifest.webmanifest`.
- Service worker correctamente configurado.
- Íconos para Windows y Android.
- Instalación desde Chrome y Edge.
- Diseño responsive y mobile-first.
- Pantallas cómodas para uso táctil.
- Estados de carga claros.
- Manejo de errores de red.
- Indicador de conexión cuando sea necesario.
- Estrategia de actualización de caché sin dejar versiones antiguas indefinidamente.

La PWA puede cachear archivos estáticos y datos no críticos. Las ventas, cambios de stock, clientes y pedidos deben requerir conexión y validación del servidor.

---

## 13. Interfaz y experiencia de uso

La interfaz debe ser clara y práctica para un comercio mayorista.

Prioridades:

- Rapidez.
- Pocos clics.
- Formularios simples.
- Tablas con búsqueda y filtros.
- Atajos de teclado en Windows.
- Buena experiencia táctil en Android.
- Confirmaciones antes de acciones destructivas.
- Mensajes en español.
- Estados de operación visibles.
- Diseño consistente entre catálogo y panel interno.

La pantalla de ventas debe priorizar el campo del lector, la lista de productos agregados, cantidades, precios, subtotal, descuentos y total.

---

## 14. Base de datos y rendimiento

Antes de crear tablas nuevas:

1. Inspeccionar el esquema actual.
2. Identificar tablas y columnas existentes.
3. Detectar claves foráneas y datos incompatibles.
4. Crear migraciones seguras.
5. No eliminar datos sin autorización explícita.

Optimizar especialmente:

- Índices sobre códigos.
- Índices sobre claves foráneas.
- Índices sobre estados y fechas.
- Consultas de catálogo paginadas.
- Proyecciones que devuelvan solo las columnas necesarias.
- Pool de conexiones.
- Transacciones en ventas.
- Límites de paginación.
- Caché de categorías y catálogo resumido.
- Imágenes optimizadas y con carga diferida.

No devolver la base completa al navegador ni cargar imágenes innecesarias en la pantalla de ventas.

---

## 15. Imágenes de productos

Las imágenes se almacenarán como archivos en el espacio de hosting y la base de datos conservará el nombre o ruta relativa.

Respetar las reglas del catálogo de CRV4:

- Formato cuadrado cuando corresponda.
- Fondo blanco puro.
- No inventar modelos.
- No alterar cantidades, colores, mecanismos ni características reales.
- Mantener imágenes optimizadas para web.
- Generar miniaturas cuando sea conveniente.
- Usar nombres seguros de archivo.
- Evitar nombres con caracteres problemáticos.

---

## 16. Despliegue en Hostinger

Preparar instrucciones concretas para:

- Configurar la aplicación Node.js en Hostinger.
- Seleccionar la versión compatible de Node.js.
- Configurar el directorio de la aplicación.
- Configurar el comando de inicio.
- Definir variables de entorno.
- Configurar la conexión MySQL.
- Asociar el dominio.
- Activar HTTPS.
- Desplegar desde GitHub o mediante el método compatible con el plan.
- Revisar logs.
- Reiniciar la aplicación de forma segura.
- Ejecutar migraciones.
- Crear un usuario administrador inicial sin exponer sus credenciales.

No asumir funcionalidades propias de un VPS. Si una característica no está disponible en el plan Cloud Startup, documentar la alternativa.

---

## 17. Observabilidad y mantenimiento

Incluir:

- Endpoint de salud, por ejemplo `/health`.
- Logs de errores.
- Logs de operaciones críticas sin guardar contraseñas ni datos sensibles innecesarios.
- Identificador de solicitud cuando sea posible.
- Registro de duración de consultas lentas.
- Manejo de errores de conexión a MySQL.
- Mensajes claros cuando el servicio esté temporalmente no disponible.

Preparar una guía de diagnóstico para problemas de:

- Aplicación Node.js detenida.
- Error de conexión MySQL.
- Variables de entorno faltantes.
- Dominio o HTTPS.
- Permisos de archivos.
- Lentitud en búsqueda por código.
- Stock inconsistente.

---

## 18. Pruebas obligatorias

Crear pruebas o verificaciones para:

- Login correcto e incorrecto.
- Control de roles.
- Acceso denegado a módulos privados.
- Registro y edición de clientes.
- Alta, edición y baja lógica de productos.
- Variantes y códigos.
- Precio por cantidad.
- Oferta vigente y vencida.
- Búsqueda por código.
- Código inexistente.
- Producto sin stock.
- Agregado repetido a una venta.
- Venta con stock suficiente.
- Venta con stock insuficiente.
- Dos operaciones concurrentes sobre el mismo stock.
- Creación de pedido.
- Cambio de estado del pedido.
- Actualización de la PWA.
- Error de conexión.
- Validación de archivos.

Medir el tiempo de respuesta del endpoint de búsqueda por código y documentar el resultado.

---

## 19. Forma de trabajo obligatoria

Trabajá por fases y no intentes construir todo de una sola vez.

### Fase 0 — Inspección

- Revisar el repositorio.
- Revisar `package.json`.
- Revisar estructura actual.
- Revisar conexión MySQL.
- Revisar tablas existentes.
- Revisar el despliegue actual.
- Informar riesgos y diferencias.

### Fase 1 — Base técnica

- Estructura modular.
- Configuración por entorno.
- Conexión MySQL segura.
- Health check.
- Manejo de errores.
- Logs.

### Fase 2 — Autenticación y roles

- Usuarios.
- Login.
- Sesiones o tokens.
- Roles.
- Middleware de permisos.

### Fase 3 — Catálogo

- Rubros jerárquicos.
- Productos.
- Variantes.
- Imágenes.
- Precios.
- Precios por cantidad.
- Ofertas.

### Fase 4 — PWA pública

- Catálogo responsive.
- Búsqueda.
- Filtros.
- Carrito.
- Registro de clientes.
- Pedidos.

### Fase 5 — Panel interno

- Productos.
- Variantes.
- Precios.
- Stock.
- Clientes.
- Pedidos.

### Fase 6 — Pantalla de ventas

- Lector de códigos.
- Búsqueda rápida.
- Caché local controlada.
- Validación de precio y stock.
- Transacciones.
- Comprobantes o registro de venta.

### Fase 7 — Pruebas y despliegue

- Pruebas funcionales.
- Pruebas de rendimiento.
- Seguridad.
- Configuración de Hostinger.
- HTTPS.
- Backup.
- Manual de uso.

Al finalizar cada fase, informar:

- Qué se implementó.
- Archivos modificados.
- Migraciones ejecutadas.
- Pruebas realizadas.
- Problemas encontrados.
- Próximo paso recomendado.

---

## 20. Reglas para Codex

- No inventar tablas, columnas o relaciones sin revisar primero la base existente.
- No usar Access.
- No crear una segunda base de datos.
- No implementar sincronización local-web.
- No conectar el frontend directamente a MySQL.
- No guardar secretos en el repositorio.
- No eliminar datos ni tablas sin autorización.
- No cambiar la lógica comercial sin explicarlo.
- No sacrificar la velocidad de la pantalla de ventas por una interfaz innecesariamente pesada.
- No cargar todo el catálogo ni todas las imágenes para buscar un código.
- No confirmar una venta sin validar nuevamente el stock y el precio en el servidor.
- No confiar únicamente en caché local para operaciones críticas.
- Mantener compatibilidad con el plan Cloud Startup de Hostinger.
- Preparar el sistema para una futura migración a VPS, pero no exigir un VPS ahora.
- Usar nombres claros y consistentes en español o definir una convención única.
- Documentar las decisiones técnicas importantes.

---

## 21. Primer pedido de ejecución

Comenzá por la **Fase 0 — Inspección**.

No escribas código todavía.

Primero:

1. Inspeccioná todos los archivos relevantes del proyecto.
2. Identificá el framework Node.js actual.
3. Identificá cómo se conecta actualmente a MySQL.
4. Revisá las tablas existentes y sus relaciones.
5. Revisá si existe catálogo, variantes, precios por cantidad, usuarios o pedidos.
6. Revisá la configuración actual para Hostinger.
7. Indicá qué partes pueden reutilizarse.
8. Indicá qué partes deben refactorizarse.
9. Proponé la estructura final de CRV5.
10. Presentá un plan de implementación por etapas.

Esperá la aprobación antes de ejecutar cambios estructurales importantes.

El objetivo es que CRV5 sea una plataforma estable, rápida, segura, escalable y práctica para el trabajo diario de CRV4 Mayorista.
