# CRV5

Base de la plataforma web progresiva para CRV4 Mayorista.

## Desarrollo local

1. Copiar `.env.example` como `.env`.
2. Instalar dependencias con `npm install`.
3. Ejecutar `npm run dev`.
4. Abrir `http://localhost:3000` y comprobar `http://localhost:3000/api/health`.

Para crear o actualizar las tablas, ejecutar `npm run db:migrate` con las variables MySQL configuradas.

## Flujo Git y Hostinger

- `main`: version destinada a produccion.
- `staging`: version destinada al sitio temporal de Hostinger.
- Cada cambio se prueba localmente, se publica en `staging` y Hostinger lo despliega automaticamente desde esa rama.
- Cuando la version este validada, se integra `staging` en `main` y se cambia la rama de despliegue del sitio publico.

En Hostinger, crear primero un sitio temporal o subdominio de desarrollo, seleccionar la aplicacion Node.js y conectar el repositorio GitHub `gabrielangelvargas-pixel/crv5` usando la rama `staging`. El comando de build es `npm run build` y el de inicio es `npm start`; ambos ejecutan la aplicacion Next.js ubicada en `apps/web`. El puerto debe ser el asignado por Hostinger y las variables de `.env.example` deben cargarse en el panel, nunca en Git.

## Migraciones en Hostinger

Las migraciones se ejecutan una vez contra la base MySQL de Hostinger desde un entorno con acceso a esas variables. La tabla `schema_migrations` registra cada archivo aplicado y evita repetirlo.
