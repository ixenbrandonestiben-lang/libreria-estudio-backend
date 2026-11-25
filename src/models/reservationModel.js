const { getPool } = require('../config/database');

/**
 * Atomically reserves product stock in products table using conditional UPDATE.
 * Must be executed inside an ACID transaction connection.
 * @param {number} productId
 * @param {number} quantity
 * @param {import('mysql2/promise').PoolConnection} conn
 * @returns {Promise<boolean>}
 */
async function reserveProductStock(productId, quantity, conn) {
  const [result] = await conn.execute(
    `UPDATE products
     SET stock_available = stock_available - ?,
         stock_reserved = stock_reserved + ?
     WHERE id = ?
       AND is_active = 1
       AND stock_available >= ?`,
    [quantity, quantity, productId, quantity]
  );
  return result.affectedRows === 1;
}

/**
 * Atomically returns reserved stock back to available stock.
 * @param {number} productId
 * @param {number} quantity
 * @param {import('mysql2/promise').PoolConnection} conn
 * @returns {Promise<boolean>}
 */
async function restoreProductStock(productId, quantity, conn) {
  const [result] = await conn.execute(
    `UPDATE products
     SET stock_available = stock_available + ?,
         stock_reserved = GREATEST(0, CAST(stock_reserved AS SIGNED) - ?)
     WHERE id = ?`,
    [quantity, quantity, productId]
  );
  return result.affectedRows === 1;
}

/**
 * Finalizes reserved stock once an order is confirmed/paid.
 * @param {number} productId
 * @param {number} quantity
 * @param {import('mysql2/promise').PoolConnection} conn
 * @returns {Promise<boolean>}
 */
async function consumeReservedStock(productId, quantity, conn) {
  const [result] = await conn.execute(
    `UPDATE products
     SET stock_reserved = GREATEST(0, CAST(stock_reserved AS SIGNED) - ?)
     WHERE id = ?`,
    [quantity, productId]
  );
  return result.affectedRows === 1;
}

/**
 * Creates a stock reservation record.
 * @param {{ cartId?: number|null, userId?: number|null, productId: number, quantity: number, expiresAt: Date|string }} data
 * @param {import('mysql2/promise').PoolConnection} conn
 */
async function createReservation(data, conn) {
  const [result] = await conn.execute(
    `INSERT INTO stock_reservations (cart_id, user_id, product_id, quantity, status, expires_at)
     VALUES (?, ?, ?, ?, 'active', ?)`,
    [
      data.cartId || null,
      data.userId || null,
      data.productId,
      data.quantity,
      data.expiresAt
    ]
  );
  return result.insertId;
}

/**
 * Lists active reservations for a cart.
 * @param {number} cartId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findActiveByCartId(cartId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, cart_id, user_id, product_id, quantity, status, expires_at, created_at
     FROM stock_reservations
     WHERE cart_id = ? AND status = 'active'
     ORDER BY id ASC`,
    [cartId]
  );
  return rows;
}

/**
 * Finds expired active reservations with row-level lock (FOR UPDATE) inside a transaction.
 * @param {number} limit
 * @param {import('mysql2/promise').PoolConnection} conn
 */
async function findExpiredActiveForUpdate(limit, conn) {
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 100));
  const [rows] = await conn.execute(
    `SELECT id, cart_id, user_id, product_id, quantity, expires_at
     FROM stock_reservations
     WHERE status = 'active' AND expires_at <= UTC_TIMESTAMP()
     ORDER BY expires_at ASC
     LIMIT ?
     FOR UPDATE`,
    [String(safeLimit)]
  );
  return rows;
}

/**
 * Updates reservation status safely only if currently active.
 * @param {number} reservationId
 * @param {'completed'|'expired'|'released'} nextStatus
 * @param {import('mysql2/promise').PoolConnection} conn
 * @returns {Promise<boolean>}
 */
async function transitionActiveStatus(reservationId, nextStatus, conn) {
  const allowedStatuses = new Set(['completed', 'expired', 'released']);
  if (!allowedStatuses.has(nextStatus)) {
    throw new Error('Invalid reservation status transition');
  }

  const [result] = await conn.execute(
    `UPDATE stock_reservations
     SET status = ?
     WHERE id = ? AND status = 'active'`,
    [nextStatus, reservationId]
  );
  return result.affectedRows === 1;
}

module.exports = {
  reserveProductStock,
  restoreProductStock,
  consumeReservedStock,
  createReservation,
  findActiveByCartId,
  findExpiredActiveForUpdate,
  transitionActiveStatus
};
