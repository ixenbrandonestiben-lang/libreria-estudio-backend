const { getPool } = require('../config/database');

const ADDRESS_COLUMNS =
  'id, user_id, label, recipient_name, recipient_phone, address_line_1, address_line_2, city, state_or_department, postal_code, reference_notes, is_default, created_at, updated_at';

/**
 * Lists all saved addresses for a user, default address first.
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findAllByUserId(userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT ${ADDRESS_COLUMNS}
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Finds a single address ensuring ownership by userId.
 * @param {number} addressId
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findByIdAndUserId(addressId, userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT ${ADDRESS_COLUMNS}
     FROM user_addresses
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [addressId, userId]
  );
  return rows[0] || null;
}

/**
 * Clears default flag on all addresses belonging to a user.
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function clearDefaultForUser(userId, conn = null) {
  const db = conn || getPool();
  await db.execute(
    `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
    [userId]
  );
}

/**
 * Creates a new address for a user.
 * @param {number} userId
 * @param {object} data
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function createAddress(userId, data, conn = null) {
  const db = conn || getPool();
  const isDefault = data.isDefault ? 1 : 0;

  if (isDefault === 1) {
    await clearDefaultForUser(userId, conn);
  }

  const [result] = await db.execute(
    `INSERT INTO user_addresses (
       user_id, label, recipient_name, recipient_phone,
       address_line_1, address_line_2, city, state_or_department,
       postal_code, reference_notes, is_default
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.label || 'Casa',
      data.recipientName,
      data.recipientPhone,
      data.addressLine1,
      data.addressLine2 || null,
      data.city,
      data.stateOrDepartment,
      data.postalCode || null,
      data.referenceNotes || null,
      isDefault
    ]
  );

  return findByIdAndUserId(result.insertId, userId, conn);
}

/**
 * Updates an address owned by userId using an explicit column whitelist.
 * @param {number} addressId
 * @param {number} userId
 * @param {object} updates
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function updateAddress(addressId, userId, updates, conn = null) {
  const db = conn || getPool();

  if (updates.isDefault === true) {
    await clearDefaultForUser(userId, conn);
  }

  const fieldMap = {
    label: 'label',
    recipientName: 'recipient_name',
    recipientPhone: 'recipient_phone',
    addressLine1: 'address_line_1',
    addressLine2: 'address_line_2',
    city: 'city',
    stateOrDepartment: 'state_or_department',
    postalCode: 'postal_code',
    referenceNotes: 'reference_notes'
  };

  const setClauses = [];
  const params = [];

  for (const [jsKey, sqlCol] of Object.entries(fieldMap)) {
    if (Object.prototype.hasOwnProperty.call(updates, jsKey) && updates[jsKey] !== undefined) {
      setClauses.push(`${sqlCol} = ?`);
      params.push(updates[jsKey]);
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'isDefault') && updates.isDefault !== undefined) {
    setClauses.push('is_default = ?');
    params.push(updates.isDefault ? 1 : 0);
  }

  if (setClauses.length === 0) {
    return findByIdAndUserId(addressId, userId, conn);
  }

  params.push(addressId, userId);
  await db.execute(
    `UPDATE user_addresses
     SET ${setClauses.join(', ')}
     WHERE id = ? AND user_id = ?`,
    params
  );

  return findByIdAndUserId(addressId, userId, conn);
}

/**
 * Deletes an address owned by userId.
 * @param {number} addressId
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function deleteAddress(addressId, userId, conn = null) {
  const db = conn || getPool();
  const [result] = await db.execute(
    `DELETE FROM user_addresses WHERE id = ? AND user_id = ?`,
    [addressId, userId]
  );
  return result.affectedRows === 1;
}

module.exports = {
  findAllByUserId,
  findByIdAndUserId,
  clearDefaultForUser,
  createAddress,
  updateAddress,
  deleteAddress
};
