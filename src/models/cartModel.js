const { getPool } = require('../config/database');

/**
 * Finds an active cart by user ID (never exposes session_token_hash).
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findCartByUserId(userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, user_id, expires_at, created_at, updated_at
     FROM carts
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Finds an active cart by hashed session token (never exposes session_token_hash).
 * @param {string} sessionTokenHash
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findCartBySessionTokenHash(sessionTokenHash, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, user_id, expires_at, created_at, updated_at
     FROM carts
     WHERE session_token_hash = ?
       AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())
     ORDER BY updated_at DESC
     LIMIT 1`,
    [sessionTokenHash]
  );
  return rows[0] || null;
}

/**
 * Creates a new cart for an authenticated user or guest session.
 * @param {{ userId?: number|null, sessionTokenHash?: string|null, expiresAt?: Date|string|null }} data
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function createCart(data, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `INSERT INTO carts (user_id, session_token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [data.userId || null, data.sessionTokenHash || null, data.expiresAt || null]
  );

  const [rows] = await db.execute(
    `SELECT id, user_id, expires_at, created_at, updated_at
     FROM carts
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );
  return rows[0] || null;
}

/**
 * Lists all items in a cart joined with live product pricing and stock availability.
 * @param {number} cartId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function getCartItems(cartId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT
       ci.id, ci.cart_id, ci.product_id, ci.quantity,
       p.sku, p.title, p.slug, p.unit_label, p.units_per_pack,
       p.price, p.stock_available, p.stock_reserved, p.image_url, p.is_active
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at ASC`,
    [cartId]
  );
  return rows;
}

/**
 * Inserts a cart item or increments quantity if it already exists.
 * @param {number} cartId
 * @param {number} productId
 * @param {number} quantity
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function upsertCartItem(cartId, productId, quantity, conn = null) {
  const db = conn || getPool();
  await db.execute(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       quantity = quantity + VALUES(quantity),
       updated_at = CURRENT_TIMESTAMP`,
    [cartId, productId, quantity]
  );
  return getCartItems(cartId, conn);
}

/**
 * Sets an exact quantity for an item in a cart.
 * @param {number} cartId
 * @param {number} productId
 * @param {number} quantity
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function setCartItemQuantity(cartId, productId, quantity, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `UPDATE cart_items
     SET quantity = ?
     WHERE cart_id = ? AND product_id = ?`,
    [quantity, cartId, productId]
  );
  return result.affectedRows === 1;
}

/**
 * Removes a single product from a cart.
 * @param {number} cartId
 * @param {number} productId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function removeCartItem(cartId, productId, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `DELETE FROM cart_items
     WHERE cart_id = ? AND product_id = ?`,
    [cartId, productId]
  );
  return result.affectedRows === 1;
}

/**
 * Removes all items from a cart.
 * @param {number} cartId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function clearCart(cartId, conn = null) {
  const db = conn || getPool();
  await db.execute(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
}

module.exports = {
  findCartByUserId,
  findCartBySessionTokenHash,
  createCart,
  getCartItems,
  upsertCartItem,
  setCartItemQuantity,
  removeCartItem,
  clearCart
};
