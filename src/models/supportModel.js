const { getPool } = require('../config/database');

const ALLOWED_FAQ_TOPICS = new Set([
  'orders',
  'shipping',
  'returns',
  'school_lists',
  'account'
]);

const ALLOWED_TICKET_STATUSES = new Set([
  'open',
  'in_progress',
  'resolved',
  'closed'
]);

/**
 * Lists active FAQ items with optional whitelisted topic and keyword search.
 * @param {{ topic?: string, search?: string }} [filters={}]
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function listFaqItems(filters = {}, conn = null) {
  const db = conn || getPool();
  const whereClauses = ['is_active = 1'];
  const params = [];

  if (filters.topic && ALLOWED_FAQ_TOPICS.has(filters.topic)) {
    whereClauses.push('topic = ?');
    params.push(filters.topic);
  }

  if (filters.search) {
    const term = `%${String(filters.search).trim()}%`;
    whereClauses.push('(question LIKE ? OR answer LIKE ?)');
    params.push(term, term);
  }

  const [rows] = await db.execute(
    `SELECT id, topic, question, answer, sort_order
     FROM faq_items
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY topic ASC, sort_order ASC, id ASC`,
    params
  );
  return rows;
}

/**
 * Creates a new support ticket.
 * @param {object} data
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function createSupportTicket(data, conn = null) {
  const db = conn || getPool();
  const normalizedEmail = String(data.contactEmail).trim().toLowerCase();

  const [result] = await db.execute(
    `INSERT INTO support_tickets (
       ticket_code, user_id, contact_email, order_number, subject, message, status
     ) VALUES (?, ?, ?, ?, ?, ?, 'open')`,
    [
      data.ticketCode,
      data.userId || null,
      normalizedEmail,
      data.orderNumber || null,
      data.subject,
      data.message
    ]
  );

  const [rows] = await db.execute(
    `SELECT id, ticket_code, user_id, contact_email, order_number, subject, message, status, created_at
     FROM support_tickets
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );
  return rows[0] || null;
}

/**
 * Lists support tickets owned by an authenticated user.
 * @param {number} userId
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function listTicketsByUserId(userId, conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, ticket_code, contact_email, order_number, subject, message, status, created_at, updated_at
     FROM support_tickets
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Finds a support ticket by ticketCode and matching contactEmail.
 * @param {string} ticketCode
 * @param {string} contactEmail
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findTicketByCodeAndEmail(ticketCode, contactEmail, conn = null) {
  const db = conn || getPool();
  const normalizedEmail = String(contactEmail).trim().toLowerCase();

  const [rows] = await db.execute(
    `SELECT id, ticket_code, order_number, subject, message, status, created_at, updated_at
     FROM support_tickets
     WHERE ticket_code = ? AND contact_email = ?
     LIMIT 1`,
    [ticketCode, normalizedEmail]
  );
  return rows[0] || null;
}

/**
 * Updates support ticket status using a strict status whitelist.
 * @param {number} ticketId
 * @param {string} nextStatus
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function updateTicketStatus(ticketId, nextStatus, conn = null) {
  if (!ALLOWED_TICKET_STATUSES.has(nextStatus)) {
    throw new Error('Invalid ticket status');
  }

  const db = conn || getPool();
  const [result] = await db.execute(
    `UPDATE support_tickets SET status = ? WHERE id = ?`,
    [nextStatus, ticketId]
  );
  return result.affectedRows === 1;
}

module.exports = {
  ALLOWED_FAQ_TOPICS,
  ALLOWED_TICKET_STATUSES,
  listFaqItems,
  createSupportTicket,
  listTicketsByUserId,
  findTicketByCodeAndEmail,
  updateTicketStatus
};
