# Fase 0: inspeccion

## Estado encontrado

- El directorio inicial contenia solamente `PROMPT_CRV5_PROYECTO_COMPLETO.md`.
- No existia repositorio Git local.
- No habia aplicacion Node.js, esquema MySQL, migraciones ni configuracion de Hostinger.
- El repositorio remoto creado para el proyecto es `gabrielangelvargas-pixel/crv5`.

## Decisiones iniciales

- Una aplicacion Node.js servira API y archivos de la PWA.
- La base de datos se conectara mediante variables de entorno y un pool MySQL.
- Se usaran ramas separadas: `staging` para el sitio temporal y `main` para produccion.
- No se almacenan secretos ni credenciales en el repositorio.

## Siguiente fase

Definir el esquema MySQL inicial, migraciones y los contratos de autenticacion y usuarios antes de incorporar la logica de ventas.
