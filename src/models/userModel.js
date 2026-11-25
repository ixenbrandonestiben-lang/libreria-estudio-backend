const { getPool } = require('../config/database');

const SAFE_USER_COLUMNS =
  'id, full_name, email, phone, role, is_active, created_at, updated_at';

/**
 * Returns a safe user profile by ID (never includes password_hash).
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findById(userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT ${SAFE_USER_COLUMNS}
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Returns a safe user profile by normalized email (never includes password_hash).
 * @param {string} email
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findByEmail(email, conn = null) {
  const db = conn || getPool();
  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await db.execute(
    `SELECT ${SAFE_USER_COLUMNS}
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );
  return rows[0] || null;
}

/**
 * Returns authentication record including password_hash.
 * Intended strictly for credential verification in authService.
 * @param {string} email
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findAuthByEmail(email, conn = null) {
  const db = conn || getPool();
  const normalizedEmail = String(email).trim().toLowerCase();
  const [rows] = await db.execute(
    `SELECT id, full_name, email, password_hash, phone, role, is_active, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [normalizedEmail]
  );
  return rows[0] || null;
}

/**
 * Creates a new user and returns the safe profile record.
 * @param {{ fullName: string, email: string, passwordHash: string, phone?: string|null, role?: string }} data
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function createUser(data, conn = null) {
  const db = conn || getPool();
  const normalizedEmail = String(data.email).trim().toLowerCase();
  const role = data.role === 'admin' ? 'admin' : 'customer';

  const [result] = await db.execute(
    `INSERT INTO users (full_name, email, password_hash, phone, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [data.fullName, normalizedEmail, data.passwordHash, data.phone || null, role]
  );

  return findById(result.insertId, conn);
}

/**
 * Updates allowed profile fields for a user and returns the safe profile.
 * @param {number} userId
 * @param {{ fullName?: string, phone?: string|null }} updates
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function updateProfile(userId, updates, conn = null) {
  const db = conn || getPool();
  const setClauses = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(updates, 'fullName') && updates.fullName !== undefined) {
    setClauses.push('full_name = ?');
    params.push(updates.fullName);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'phone') && updates.phone !== undefined) {
    setClauses.push('phone = ?');
    params.push(updates.phone || null);
  }

  if (setClauses.length === 0) {
    return findById(userId, conn);
  }

  params.push(userId);
  await db.execute(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  return findById(userId, conn);
}

/**
 * Updates a user's password hash.
 * @param {number} userId
 * @param {string} passwordHash
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function updatePasswordHash(userId, passwordHash, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [passwordHash, userId]
  );
  return result.affectedRows === 1;
}

/**
 * Deactivates a user account (soft delete / privacy request).
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function deactivateUser(userId, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `UPDATE users SET is_active = 0 WHERE id = ?`,
    [userId]
  );
  return result.affectedRows === 1;
}

/**
 * Stores a hashed password reset token.
 * @param {{ userId: number, tokenHash: string, expiresAt: Date|string }} data
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function createPasswordResetToken(data, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [data.userId, data.tokenHash, data.expiresAt]
  );
  return result.insertId;
}

/**
 * Finds a valid, unused, non-expired password reset token without returning token_hash.
 * @param {string} tokenHash
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findValidResetToken(tokenHash, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, user_id, expires_at, used_at, created_at
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

/**
 * Marks a password reset token as used.
 * @param {number} tokenId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function markResetTokenUsed(tokenId, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `UPDATE password_reset_tokens
     SET used_at = UTC_TIMESTAMP()
     WHERE id = ? AND used_at IS NULL`,
    [tokenId]
  );
  return result.affectedRows === 1;
}

module.exports = {
  findById,
  findByEmail,
  findAuthByEmail,
  createUser,
  updateProfile,
  updatePasswordHash,
  deactivateUser,
  createPasswordResetToken,
  findValidResetToken,
  markResetTokenUsed
};
