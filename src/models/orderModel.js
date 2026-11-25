const { getPool } = require('../config/database');

const ALLOWED_ORDER_STATUSES = new Set([
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);

/**
 * Creates an order header record inside a transaction.
 * @param {object} data
 * @param {import('mysql2/promise').PoolConnection} conn
 */
async function createOrder(data, conn) {
  const normalizedEmail = String(data.customerEmail).trim().toLowerCase();
  const addressJson = JSON.stringify(data.shippingAddressSnapshot);

  const [result] = await conn.execute(
    `INSERT INTO orders (
       order_number, user_id, customer_email, customer_name, customer_phone,
       shipping_address_snapshot, delivery_method, subtotal, discount_amount,
       shipping_cost, tax_amount, total_amount, status, payment_reference,
       terms_accepted, terms_accepted_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.orderNumber,
      data.userId || null,
      normalizedEmail,
      data.customerName,
      data.customerPhone || null,
      addressJson,
      data.deliveryMethod || 'home_delivery',
      data.subtotal,
      data.discountAmount || '0.00',
      data.shippingCost || '0.00',
      data.taxAmount || '0.00',
      data.totalAmount,
      data.status || 'pending_payment',
      data.paymentReference || null,
      data.termsAccepted ? 1 : 0,
      data.termsAcceptedAt || null
    ]
  );

  return result.insertId;
}

/**
 * Inserts immutable order item snapshots inside a transaction.
 * @param {number} orderId
 * @param {Array<object>} items
 * @param {import('mysql2/promise').PoolConnection} conn
 */
async function createOrderItems(orderId, items, conn) {
  for (const item of items) {
    await conn.execute(
      `INSERT INTO order_items (
         order_id, product_id, sku_snapshot, title_snapshot,
         unit_price_snapshot, quantity, line_total
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.productId,
        item.skuSnapshot,
        item.titleSnapshot,
        item.unitPriceSnapshot,
        item.quantity,
        item.lineTotal
      ]
    );
  }
}

/**
 * Finds an order by idempotency payment reference.
 * @param {string} paymentReference
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findByPaymentReference(paymentReference, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, order_number, status, total_amount, payment_reference, created_at
     FROM orders
     WHERE payment_reference = ?
     LIMIT 1`,
    [paymentReference]
  );
  return rows[0] || null;
}

/**
 * Lists orders for an authenticated user with pagination.
 * @param {number} userId
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function listByUserId(userId, page = 1, limit = 10, conn = null) {
  const db = conn || getPool();
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await db.execute(
    `SELECT
       id, order_number, delivery_method, subtotal, discount_amount,
       shipping_cost, tax_amount, total_amount, status, created_at, updated_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, String(safeLimit), String(offset)]
  );
  return rows;
}

/**
 * Fetches order items for a given order ID.
 * @param {number} orderId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findOrderItems(orderId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT
       id, order_id, product_id, sku_snapshot, title_snapshot,
       unit_price_snapshot, quantity, line_total, created_at
     FROM order_items
     WHERE order_id = ?
     ORDER BY id ASC`,
    [orderId]
  );
  return rows;
}

/**
 * Finds an order owned by userId with its item snapshots.
 * @param {string} orderNumber
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findByOrderNumberAndUserId(orderNumber, userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT
       id, order_number, user_id, customer_email, customer_name, customer_phone,
       shipping_address_snapshot, delivery_method, subtotal, discount_amount,
       shipping_cost, tax_amount, total_amount, status, payment_reference,
       terms_accepted, terms_accepted_at, created_at, updated_at
     FROM orders
     WHERE order_number = ? AND user_id = ?
     LIMIT 1`,
    [orderNumber, userId]
  );

  const order = rows[0] || null;
  if (!order) {
    return null;
  }

  order.items = await findOrderItems(order.id, conn);
  return order;
}

/**
 * Public order tracking requiring both orderNumber and matching customerEmail.
 * @param {string} orderNumber
 * @param {string} customerEmail
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findForTracking(orderNumber, customerEmail, conn = null) {
  const db = conn || getPool();
  const normalizedEmail = String(customerEmail).trim().toLowerCase();

  const [rows] = await db.execute(
    `SELECT
       id, order_number, delivery_method, subtotal, discount_amount,
       shipping_cost, tax_amount, total_amount, status, created_at, updated_at
     FROM orders
     WHERE order_number = ? AND customer_email = ?
     LIMIT 1`,
    [orderNumber, normalizedEmail]
  );

  const order = rows[0] || null;
  if (!order) {
    return null;
  }

  order.items = await findOrderItems(order.id, conn);
  return order;
}

/**
 * Updates an order status using a strict status whitelist.
 * @param {number} orderId
 * @param {string} nextStatus
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function updateStatus(orderId, nextStatus, conn = null) {
  if (!ALLOWED_ORDER_STATUSES.has(nextStatus)) {
    throw new Error('Invalid order status');
  }

  const db = conn || getPool();
  const [result] = await db.execute(
    `UPDATE orders SET status = ? WHERE id = ?`,
    [nextStatus, orderId]
  );
  return result.affectedRows === 1;
}

/**
 * Lists all orders for admin management with optional status filter and pagination.
 * @param {{ page?: number, limit?: number, status?: string }} [filters={}]
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findAllForAdmin(filters = {}, conn = null) {
  const db = conn || getPool();
  const page = Math.max(1, Number.parseInt(filters.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(filters.limit || '20', 10) || 20));
  const offset = (page - 1) * limit;

  const whereClauses = [];
  const params = [];

  if (filters.status && ALLOWED_ORDER_STATUSES.has(filters.status)) {
    whereClauses.push('status = ?');
    params.push(filters.status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM orders ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await db.execute(
    `SELECT
       id, order_number, user_id, customer_email, customer_name, customer_phone,
       delivery_method, subtotal, discount_amount, shipping_cost, tax_amount,
       total_amount, status, payment_reference, created_at, updated_at
     FROM orders
     ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)]
  );

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  ALLOWED_ORDER_STATUSES,
  createOrder,
  createOrderItems,
  findByPaymentReference,
  listByUserId,
  findOrderItems,
  findByOrderNumberAndUserId,
  findForTracking,
  updateStatus,
  findAllForAdmin
};
