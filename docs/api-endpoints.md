# Documentación de Endpoints — Librería Estudio API

## Convenciones generales

- **Prefijo base:** `/api/v1`
- **Formato de intercambio:** `application/json; charset=utf-8`
- **Codificación:** UTF-8 (`utf8mb4` en MySQL)

### Estructura estándar de respuesta

**Éxito:**
```json
{
  "success": true,
  "message": "Operación completada",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados contienen errores de validación",
    "details": []
  }
}
```

---

## Salud del servicio

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Verifica estado de la API y conectividad con MySQL (`200 OK` / `503 Service Unavailable`). | Pública |
| `GET` | `/api/v1/health` | Alias versionado de salud del servicio. | Pública |

---

## Autenticación (`/api/v1/auth`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Registro de usuario (`{ fullName, email, password, phone? }`). | Pública |
| `POST` | `/api/v1/auth/login` | Inicio de sesión y emisión de JWT. | Pública |
| `POST` | `/api/v1/auth/logout` | Cierre de sesión. | Pública |
| `POST` | `/api/v1/auth/forgot-password` | Solicitud de token de recuperación de contraseña. | Pública |
| `POST` | `/api/v1/auth/reset-password` | Restablecimiento con `{ token, newPassword }`. | Pública |
| `GET` | `/api/v1/auth/me` | Perfil del usuario autenticado. | Requerida |

---

## Catálogo y Productos (`/api/v1/products`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products/categories` | Lista categorías activas. | Pública |
| `GET` | `/api/v1/products/brands` | Lista marcas activas. | Pública |
| `GET` | `/api/v1/products` | Listado paginado y filtrado (`q`, `category`, `brand`, `minPrice`, `maxPrice`, `inStock`, `ruling_type`, `sheet_count`, `paper_weight_gsm`, `format_size`, `education_level`, `sort`). | Pública |
| `GET` | `/api/v1/products/:idOrSlug` | Detalle de producto y atributos técnicos. | Pública |

---

## Cotizador de Listas Escolares (`/api/v1/school-lists`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/school-lists/quote` | Recibe `{ rawText?, items?, allowSubstitutes? }` y devuelve ítems clasificados (`exact_match`, `alternative`, `out_of_stock`, `not_found`) con subtotal estimado. | Pública |

---

## Carrito y Reservas (`/api/v1/cart`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Obtiene el carrito actual (usuario o `X-Cart-Token` / cookie). | Opcional |
| `POST` | `/api/v1/cart/items` | Agrega producto `{ productId, quantity }`. | Opcional |
| `PUT` | `/api/v1/cart/items/:productId` | Actualiza cantidad `{ quantity }`. | Opcional |
| `DELETE` | `/api/v1/cart/items/:productId` | Elimina producto del carrito. | Opcional |
| `DELETE` | `/api/v1/cart` | Vacía el carrito. | Opcional |
| `POST` | `/api/v1/cart/reserve` | Inicia reserva temporal de inventario para checkout. | Opcional |

---

## Órdenes y Rastreo (`/api/v1/orders`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | Crea orden con transacción ACID, recálculo en servidor y `termsAccepted: true`. | Opcional |
| `GET` | `/api/v1/orders` | Historial de órdenes del usuario autenticado. | Requerida |
| `GET` | `/api/v1/orders/track` | Rastreo público por `?orderNumber=...&email=...`. | Pública |
| `GET` | `/api/v1/orders/:orderNumber` | Detalle de orden propia (anti-IDOR). | Requerida |
| `PATCH` | `/api/v1/orders/:orderNumber/status` | Transición controlada de estado. | Admin |

---

## Usuario, Soporte y Legal (`/api/v1/users`, `/api/v1/support`, `/api/v1/legal`)

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` / `PUT` | `/api/v1/users/profile` | Consulta o actualiza perfil (`fullName`, `phone`). | Requerida |
| `GET` / `POST` | `/api/v1/users/addresses` | Lista o crea direcciones de entrega. | Requerida |
| `PUT` / `DELETE` | `/api/v1/users/addresses/:addressId` | Actualiza o elimina dirección propia. | Requerida |
| `GET` | `/api/v1/support/faq` | Lista/filtra preguntas frecuentes. | Pública |
| `POST` | `/api/v1/support/tickets` | Crea ticket (`{ contactEmail, subject, message, orderNumber? }`). | Opcional |
| `GET` | `/api/v1/legal/metadata` | Versiones vigentes de Términos, Privacidad y Cookies. | Pública |
| `GET` / `POST` | `/api/v1/legal/cookies/consent` | Consulta o guarda consentimiento granular de cookies. | Opcional |

---

## Administración (`/api/v1/admin`)

Todos los endpoints bajo `/api/v1/admin` requieren autenticación JWT (`authMiddleware`) y rol `admin` (`requireRole('admin')`).

| Método | Ruta | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/users` | Lista usuarios paginados sin `password_hash` (`?page`, `?limit`, `?q`). | Admin |
| `PATCH` | `/api/v1/admin/users/:userId` | Actualiza `{ role?, isActive? }` (impide auto-degradación o auto-desactivación con `400 SELF_ROLE_CHANGE_FORBIDDEN`). | Admin |
| `GET` | `/api/v1/admin/products` | Lista todos los productos incluyendo inactivos (`?page`, `?limit`, `?q`). | Admin |
| `POST` | `/api/v1/admin/products` | Crea un nuevo producto en el catálogo. | Admin |
| `PATCH` | `/api/v1/admin/products/:productId` | Actualiza campos, precio, stock o estado activo de un producto. | Admin |
| `GET` | `/api/v1/admin/orders` | Lista todas las órdenes (`?page`, `?limit`, `?status`). | Admin |
| `GET` | `/api/v1/admin/tickets` | Lista todos los tickets de soporte (`?page`, `?limit`, `?status`). | Admin |
| `PATCH` | `/api/v1/admin/tickets/:ticketCode` | Actualiza el estado de un ticket (`open`, `in_progress`, `resolved`, `closed`). | Admin |
