const { getPool } = require('../config/database');

/**
 * Records a user's or visitor's cookie consent preferences.
 * Never returns consent_token_hash in response payloads.
 * @param {object} data
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function saveCookieConsent(data, conn = null) {
  const db = conn || getPool();

  const [result] = await db.execute(
    `INSERT INTO cookie_consents (
       user_id, consent_token_hash, necessary_enabled,
       analytics_enabled, preferences_enabled, policy_version
     ) VALUES (?, ?, 1, ?, ?, ?)`,
    [
      data.userId || null,
      data.consentTokenHash,
      data.analyticsEnabled ? 1 : 0,
      data.preferencesEnabled ? 1 : 0,
      data.policyVersion || '1.0'
    ]
  );

  const [rows] = await db.execute(
    `SELECT id, user_id, necessary_enabled, analytics_enabled, preferences_enabled, policy_version, created_at, updated_at
     FROM cookie_consents
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );
  return rows[0] || null;
}

/**
 * Retrieves the most recent cookie consent by hashed consent token.
 * @param {string} consentTokenHash
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findLatestByTokenHash(consentTokenHash, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, user_id, necessary_enabled, analytics_enabled, preferences_enabled, policy_version, created_at, updated_at
     FROM cookie_consents
     WHERE consent_token_hash = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [consentTokenHash]
  );
  return rows[0] || null;
}

/**
 * Retrieves the most recent cookie consent for an authenticated user.
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findLatestByUserId(userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, user_id, necessary_enabled, analytics_enabled, preferences_enabled, policy_version, created_at, updated_at
     FROM cookie_consents
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  saveCookieConsent,
  findLatestByTokenHash,
  findLatestByUserId
};
