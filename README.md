# CRV5

Base de la plataforma web progresiva para CRV4 Mayorista.

## Desarrollo local

1. Copiar `.env.example` como `.env`.
2. Instalar dependencias con `npm install`.
3. Ejecutar `npm run dev`.
4. Abrir `http://localhost:3000` y comprobar `http://localhost:3000/api/health`.

La conexion MySQL queda preparada, pero no se ejecutan migraciones ni se usan credenciales reales en esta fase.

## Flujo Git y Hostinger

- `main`: version destinada a produccion.
- `staging`: version destinada al sitio temporal de Hostinger.
- Cada cambio se prueba localmente, se publica en `staging` y Hostinger lo despliega automaticamente desde esa rama.
- Cuando la version este validada, se integra `staging` en `main` y se cambia la rama de despliegue del sitio publico.

En Hostinger, crear primero un sitio temporal o subdominio de desarrollo, seleccionar la aplicacion Node.js y conectar el repositorio GitHub `gabrielangelvargas-pixel/crv5` usando la rama `staging`. El comando de inicio es `npm start`, el puerto debe ser el asignado por Hostinger y las variables de `.env.example` deben cargarse en el panel, nunca en Git.
