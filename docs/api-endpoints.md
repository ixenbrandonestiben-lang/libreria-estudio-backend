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
| `PATCH` | `/api/v1/orders/:orderId/status` | Transición controlada de estado. | Admin |

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
| `GET` | `/api/v1/admin/analytics` | Analítica ejecutiva (ingresos, órdenes por estado, top 8 productos, alertas de bajo stock, usuarios y tickets abiertos). | Admin |
| `GET` | `/api/v1/admin/users` | Lista usuarios paginados sin `password_hash` (`?page`, `?limit`, `?q`). | Admin |
| `PATCH` | `/api/v1/admin/users/:userId` | Actualiza `{ role?, isActive? }` (impide auto-degradación o auto-desactivación con `400 SELF_ROLE_CHANGE_FORBIDDEN`). | Admin |
| `GET` | `/api/v1/admin/products` | Lista todos los productos incluyendo inactivos (`?page`, `?limit`, `?q`). | Admin |
| `POST` | `/api/v1/admin/products` | Crea un nuevo producto en el catálogo. | Admin |
| `PATCH` | `/api/v1/admin/products/:productId` | Actualiza campos, precio, stock o estado activo de un producto. | Admin |
| `GET` | `/api/v1/admin/orders` | Lista todas las órdenes (`?page`, `?limit`, `?status`). | Admin |
| `GET` | `/api/v1/admin/tickets` | Lista todos los tickets de soporte (`?page`, `?limit`, `?status`). | Admin |
| `PATCH` | `/api/v1/admin/tickets/:ticketCode` | Actualiza el estado de un ticket (`open`, `in_progress`, `resolved`, `closed`). | Admin |

---

## Ejemplos reales de Petición y Respuesta (Flujos Clave)

### 1. Login (`POST /api/v1/auth/login`)

**Petición:**
```json
{
  "email": "cliente@ejemplo.com",
  "password": "MiPasswordSegura123"
}
```

**Respuesta (`200 OK`):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 12,
      "fullName": "Ana García",
      "email": "cliente@ejemplo.com",
      "phone": "+502 5555-1234",
      "role": "customer",
      "isActive": true,
      "createdAt": "2026-11-20T14:30:00.000Z"
    },
    "token": "<JWT_ACCESS_TOKEN>"
  }
}
```

---

### 2. Catálogo (`GET /api/v1/products?q=cuaderno&ruling_type=cuadriculado&page=1&limit=10`)

**Respuesta (`200 OK`):**
```json
{
  "success": true,
  "message": "Productos obtenidos correctamente",
  "data": [
    {
      "id": 1,
      "sku": "CUA-A4-100C",
      "isbn": null,
      "title": "Cuaderno Universitario A4 100 Hojas Cuadriculado",
      "slug": "cuaderno-universitario-a4-100-hojas-cuadriculado",
      "short_description": "Cuaderno espiralado con papel bond 75g y tapa dura.",
      "unit_label": "unidad",
      "units_per_pack": 1,
      "price": "24.50",
      "stock_available": 48,
      "stock_reserved": 2,
      "image_url": "https://cdn.ejemplo.com/cuaderno-a4.jpg",
      "category_name": "Cuadernos",
      "brand_name": "Norma"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3. Cotizador de Listas Escolares (`POST /api/v1/school-lists/quote`)

**Petición:**
```json
{
  "rawText": "1. 2 cuadernos cuadriculados 100 hojas A4\n2. Caja de 12 colores\n3. Compás espacial inexistente",
  "educationLevel": "primaria"
}
```

**Respuesta (`200 OK`):**
```json
{
  "success": true,
  "message": "Cotización de lista escolar generada",
  "data": {
    "items": [
      {
        "requestedLine": "1. 2 cuadernos cuadriculados 100 hojas A4",
        "normalizedDescription": "cuadernos cuadriculados 100 hojas A4",
        "quantity": 2,
        "extractedAttributes": {
          "ruling_type": "cuadriculado",
          "sheet_count": "100",
          "format_size": "A4",
          "education_level": "primaria"
        },
        "matchStatus": "exact_match",
        "selectedProduct": {
          "id": 1,
          "sku": "CUA-A4-100C",
          "title": "Cuaderno Universitario A4 100 Hojas Cuadriculado",
          "price": "24.50",
          "stock_available": 48,
          "score": 0.92
        },
        "alternativeProducts": [],
        "lineEstimatedTotal": "49.00"
      },
      {
        "requestedLine": "3. Compás espacial inexistente",
        "normalizedDescription": "Compás espacial inexistente",
        "quantity": 1,
        "extractedAttributes": {
          "education_level": "primaria"
        },
        "matchStatus": "not_found",
        "selectedProduct": null,
        "alternativeProducts": [],
        "lineEstimatedTotal": "0.00"
      }
    ],
    "summary": {
      "totalItems": 3,
      "exactMatches": 1,
      "alternatives": 1,
      "outOfStock": 0,
      "notFound": 1,
      "estimatedSubtotal": "84.00"
    }
  }
}
```

---

### 4. Carrito — Agregar Ítem con Reserva Atómica (`POST /api/v1/cart/items`)

**Headers opcionales:** `Authorization: Bearer <JWT>` o `X-Cart-Token: <GUEST_TOKEN>`

**Petición:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Respuesta (`201 Created`):**
```json
{
  "success": true,
  "message": "Producto agregado al carrito con reserva de stock",
  "data": {
    "cartId": 7,
    "cartToken": null,
    "items": [
      {
        "id": 15,
        "productId": 1,
        "sku": "CUA-A4-100C",
        "title": "Cuaderno Universitario A4 100 Hojas Cuadriculado",
        "slug": "cuaderno-universitario-a4-100-hojas-cuadriculado",
        "unitLabel": "unidad",
        "unitsPerPack": 1,
        "unitPrice": "24.50",
        "quantity": 2,
        "lineTotal": "49.00",
        "stockAvailable": 46,
        "imageUrl": "https://cdn.ejemplo.com/cuaderno-a4.jpg",
        "isActive": true
      }
    ],
    "summary": {
      "itemCount": 1,
      "totalUnits": 2,
      "subtotal": "49.00"
    }
  }
}
```

---

### 5. Checkout — Crear Orden ACID (`POST /api/v1/orders`)

**Petición:**
```json
{
  "customerEmail": "cliente@ejemplo.com",
  "customerName": "Ana García",
  "customerPhone": "+502 5555-1234",
  "deliveryMethod": "home_delivery",
  "shippingAddress": {
    "recipientName": "Ana García",
    "recipientPhone": "+502 5555-1234",
    "addressLine1": "6a Avenida 10-25 Zona 10",
    "city": "Ciudad de Guatemala",
    "stateOrDepartment": "Guatemala",
    "postalCode": "01010",
    "referenceNotes": "Portón verde"
  },
  "paymentReference": "PAY-20261126-0001",
  "termsAccepted": true
}
```

**Respuesta (`201 Created`):**
```json
{
  "success": true,
  "message": "Orden creada exitosamente",
  "data": {
    "id": 104,
    "order_number": "LE-20261126-0104",
    "customer_email": "cliente@ejemplo.com",
    "customer_name": "Ana García",
    "delivery_method": "home_delivery",
    "subtotal": "49.00",
    "discount_amount": "0.00",
    "shipping_cost": "25.00",
    "tax_amount": "0.00",
    "total_amount": "74.00",
    "status": "paid",
    "payment_reference": "PAY-20261126-0001",
    "terms_accepted": 1,
    "items": [
      {
        "product_id": 1,
        "sku_snapshot": "CUA-A4-100C",
        "title_snapshot": "Cuaderno Universitario A4 100 Hojas Cuadriculado",
        "unit_price_snapshot": "24.50",
        "quantity": 2,
        "line_total": "49.00"
      }
    ]
  }
}
```

---

### 6. Admin Analytics (`GET /api/v1/admin/analytics`)

**Headers:** `Authorization: Bearer <ADMIN_JWT>`

**Respuesta (`200 OK`):**
```json
{
  "success": true,
  "message": "Analítica ejecutiva obtenida correctamente",
  "data": {
    "summary": {
      "totalRevenue": 15420.5,
      "totalOrders": 86,
      "averageOrderValue": 179.31,
      "pendingFulfillmentCount": 4,
      "totalUsers": 42,
      "openTicketsCount": 2,
      "lowStockCount": 3
    },
    "ordersByStatus": [
      { "status": "delivered", "count": 64 },
      { "status": "paid", "count": 12 },
      { "status": "processing", "count": 4 },
      { "status": "cancelled", "count": 6 }
    ],
    "topProducts": [
      {
        "product_id": 1,
        "sku_snapshot": "CUA-A4-100C",
        "title_snapshot": "Cuaderno Universitario A4 100 Hojas Cuadriculado",
        "unitsSold": 140,
        "revenue": 3430
      }
    ],
    "lowStockProducts": [
      {
        "id": 9,
        "sku": "BOL-AZ-07",
        "title": "Bolígrafo Azul Punta Fina 0.7mm",
        "stock_available": 5,
        "stock_reserved": 2
      }
    ]
  }
}
```
