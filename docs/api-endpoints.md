# Documentación de Endpoints — Librería Estudio API

## Convenciones generales

- **Prefijo base:** `/api/v1` (configurable mediante `API_PREFIX`)
- **Formato de intercambio:** `application/json; charset=utf-8`
- **Codificación:** UTF-8 (`utf8mb4` en MySQL)

### Estructura estándar de respuesta

**Éxito:**
```json
{
  "ok": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción clara del error"
  }
}
```

---

## Salud del servicio

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Verifica estado de la API y conectividad con MySQL (`200 OK` / `503 Service Unavailable`). | Pública |

---

## Catálogo de Libros (`/api/v1/books`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/books` | Lista libros con paginación (`page`, `limit`), búsqueda (`q`) y filtro por categoría (`category`). | Pública |
| `GET` | `/api/v1/books/:id` | Obtiene el detalle completo de un libro por su ID. | Pública |
| `POST` | `/api/v1/books` | Registra un nuevo libro en el catálogo. | Requerida (Admin) |
| `PUT` | `/api/v1/books/:id` | Actualiza los datos de un libro existente. | Requerida (Admin) |
| `DELETE` | `/api/v1/books/:id` | Elimina o desactiva un libro del catálogo. | Requerida (Admin) |

---

## Categorías (`/api/v1/categories`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Lista todas las categorías disponibles en la librería. | Pública |
| `POST` | `/api/v1/categories` | Crea una nueva categoría. | Requerida (Admin) |

---

## Consultas y Reservas (`/api/v1/inquiries`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/inquiries` | Envía una consulta o solicitud de reserva de libro. Protegido con rate limiting. | Pública |
| `GET` | `/api/v1/inquiries` | Lista consultas recibidas para gestión interna. | Requerida (Admin) |

---

## Códigos de estado HTTP esperados

- `200 OK`: Operación exitosa.
- `201 Created`: Recurso creado correctamente.
- `400 Bad Request`: Parámetros inválidos o error de validación.
- `401 Unauthorized`: Token ausente, inválido o expirado.
- `403 Forbidden`: Permisos insuficientes.
- `404 Not Found`: Recurso no encontrado.
- `429 Too Many Requests`: Límite de peticiones excedido (rate limit).
- `500 Internal Server Error`: Error inesperado del servidor (sin exponer stack traces en producción).
