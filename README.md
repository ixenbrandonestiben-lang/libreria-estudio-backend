# Librería Estudio — Backend API

API REST de **Librería Estudio** construida sobre Node.js 20 y MySQL 8.0, preparada para desarrollo local y despliegue contenerizado en Docker / Dokploy.

## Requisitos previos

- **Node.js** `>= 20.x` y `npm`
- **Docker** y **Docker Compose** (v2+)
- **MySQL 8.0** (opcional si se ejecuta únicamente vía Docker Compose)

## Configuración inicial

1. Copia el archivo de variables de entorno de ejemplo:

```bash
cp .env.example .env
```

2. Edita `.env` y define contraseñas seguras y un `JWT_SECRET` robusto (por ejemplo, generado con `openssl rand -hex 32`).

> **Importante:** Nunca subas el archivo `.env` al control de versiones.

## Uso en desarrollo local

1. Instala las dependencias:

```bash
npm install
```

2. Asegúrate de tener una instancia de MySQL 8.0 accesible y configura `DB_HOST=127.0.0.1` en tu `.env`.
3. Inicia el servidor en modo desarrollo:

```bash
npm run dev
```

4. Comandos de calidad de código:

```bash
npm run lint
npm run format
```

## Despliegue con Docker Compose

El archivo `docker-compose.yml` levanta dos servicios:
- `mysql-db`: MySQL 8.0 configurado con `utf8mb4`, volumen persistente `mysql_data`, `healthcheck` y aislado en la red privada `backend-internal-net`.
- `backend-api`: Contenedor `node:20-alpine` ejecutándose como usuario no-root `appuser`, que espera a que `mysql-db` esté sano (`service_healthy`).

Para construir y levantar el stack:

```bash
docker compose up -d --build
```

Para verificar el estado y los logs:

```bash
docker compose ps
docker compose logs -f backend-api
```

Para detener los servicios manteniendo los datos:

```bash
docker compose down
```

## Migraciones y Seeds

Si el proyecto incluye scripts de migración y carga inicial de datos, puedes ejecutarlos de forma local o dentro del contenedor en ejecución:

### En local
```bash
npm run migrate
npm run seed
```

### Dentro de Docker
```bash
docker compose exec backend-api npm run migrate
docker compose exec backend-api npm run seed
```

## Documentación adicional

- [Contrato de Endpoints API](docs/api-endpoints.md)
- [Checklist de Seguridad y Anti-Bloqueo](docs/security-and-anti-block-checklist.md)
