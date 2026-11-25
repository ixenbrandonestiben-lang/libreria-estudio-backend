# Checklist de Seguridad y Anti-Bloqueo — Backend

Este documento recoge los controles obligatorios antes de desplegar **Librería Estudio Backend** en producción (Docker / Dokploy).

## 1. Gestión de Secretos y Configuración
- [ ] El archivo `.env` está excluido en `.gitignore` y `.dockerignore`.
- [ ] `.env.example` contiene únicamente valores de marcador (`CHANGE_ME_*`), sin credenciales reales.
- [ ] `JWT_SECRET` tiene al menos 32 bytes de entropía aleatoria.
- [ ] No existen contraseñas, tokens ni claves API hardcodeadas en `src/`, `Dockerfile` ni `docker-compose.yml`.

## 2. Endurecimiento de Contenedores e Infraestructura
- [ ] La imagen usa `node:20-alpine` con `NODE_ENV=production` y `npm ci --omit=dev`.
- [ ] El proceso Node.js se ejecuta bajo el usuario no-root `appuser` (nunca `root`).
- [ ] `mysql-db` usa MySQL 8.0 con `utf8mb4` / `utf8mb4_unicode_ci` y volumen persistente (`mysql_data`).
- [ ] `mysql-db` NO expone el puerto `3306` al exterior y permanece aislado en la red interna `backend-internal-net` (`internal: true`).
- [ ] `backend-api` depende de `mysql-db` con condición `service_healthy`.

## 3. Seguridad de la Aplicación (OWASP)
- [ ] Cabeceras de seguridad activas (`helmet`) y `X-Powered-By` deshabilitado.
- [ ] `CORS_ORIGIN` restringido a los dominios autorizados del frontend (evitar `*` en producción).
- [ ] Rate limiting configurado (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`) para mitigar fuerza bruta y abuso.
- [ ] Todas las consultas SQL usan sentencias preparadas / parámetros enlazados (cero concatenación de strings).
- [ ] Validación estricta de entrada (tipos, longitudes, formatos) antes de procesar o persistir datos.
- [ ] Manejo centralizado de errores sin filtrar stack traces ni detalles internos de MySQL en `NODE_ENV=production`.

## 4. Resiliencia y Anti-Bloqueo
- [ ] `HEALTHCHECK` configurado en `Dockerfile` apuntando a `/health` con timeout acotado.
- [ ] Pool de conexiones MySQL limitado (`DB_POOL_LIMIT`) y con timeouts definidos para evitar agotamiento de conexiones.
- [ ] Manejo de señales `SIGTERM` y `SIGINT` para cierre elegante (*graceful shutdown*) del servidor HTTP y del pool de base de datos.
- [ ] Peticiones externas (si existen) con timeouts explícitos para no bloquear el event loop.
- [ ] Logs estructurados sin datos personales sensibles (PII), contraseñas ni tokens JWT.
