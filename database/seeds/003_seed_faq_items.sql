-- Seed 003: Initial FAQ items for Help Center (idempotent by topic + sort_order)

SET NAMES utf8mb4;

INSERT INTO faq_items (topic, question, answer, sort_order, is_active)
SELECT * FROM (
  SELECT 'school_lists' AS topic,
         '¿Cómo funciona el cotizador de listas escolares?' AS question,
         'Ingresa o pega los artículos de tu lista escolar (por ejemplo: "3 cuadernos cuadro chico 100 hojas" o "1 calculadora científica"). Nuestro sistema busca coincidencias exactas por especificaciones técnicas, sugiere alternativas si algún producto está agotado y calcula el subtotal en tiempo real para que puedas agregarlo al carrito con un clic.' AS answer,
         1 AS sort_order,
         1 AS is_active
  UNION ALL
  SELECT 'school_lists',
         '¿Puedo cambiar un producto sugerido por otra marca o presentación?',
         'Sí. En cada renglón de tu lista cotizada verás la coincidencia principal y las alternativas compatibles en formato, rayado o nivel escolar para que elijas la opción que prefieras antes de pasar al carrito.',
         2, 1
  UNION ALL
  SELECT 'orders',
         '¿Cuánto tiempo se reservan los productos en mi carrito?',
         'Al iniciar el proceso de compra, reservamos temporalmente las unidades de tu carrito por 15 minutos para garantizar que nadie más compre tu stock mientras completas el pago. Si el tiempo vence, las unidades regresan automáticamente al inventario disponible.',
         1, 1
  UNION ALL
  SELECT 'orders',
         '¿Cómo puedo rastrear el estado de mi pedido?',
         'Puedes consultar el estado de tu compra en la sección "Rastrear Pedido" ingresando tu número de orden (por ejemplo, ORD-2026-0001) y el correo electrónico con el que realizaste la compra.',
         2, 1
  UNION ALL
  SELECT 'shipping',
         '¿Cuáles son los métodos y tiempos de entrega?',
         'Ofrecemos envío a domicilio en 24 a 72 horas hábiles dentro del área metropolitana y recolección en tienda sin costo adicional una vez que recibas el correo de confirmación de pedido listo.',
         1, 1
  UNION ALL
  SELECT 'returns',
         '¿Cuál es la política de cambios y devoluciones?',
         'Aceptamos cambios o devoluciones dentro de los 15 días posteriores a la entrega siempre que los libros, cuadernos o útiles estén sin uso, en su empaque original y con comprobante de compra.',
         1, 1
  UNION ALL
  SELECT 'account',
         '¿Es obligatorio crear una cuenta para comprar?',
         'No es obligatorio, pero al crear una cuenta puedes guardar múltiples direcciones de entrega (casa, colegio, oficina), consultar tu historial completo de pedidos y gestionar tus preferencias de privacidad.',
         1, 1
  UNION ALL
  SELECT 'account',
         '¿Cómo configuro o revoco el consentimiento de cookies?',
         'Puedes actualizar tus preferencias de cookies en cualquier momento desde el enlace "Configurar Cookies" en el pie de página. Las cookies estrictamente necesarias permanecen activas para mantener tu carrito y sesión.',
         2, 1
) AS seed_data
WHERE NOT EXISTS (
  SELECT 1 FROM faq_items f
  WHERE f.topic = seed_data.topic AND f.question = seed_data.question
);
