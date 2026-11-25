const mysql = require('mysql2/promise');

let pool = null;

/**
 * Builds the MySQL connection pool configuration from environment variables.
 * Never hardcodes credentials; relies on runtime environment configuration.
 * @returns {import('mysql2/promise').PoolOptions}
 */
function buildPoolConfig() {
  const port = Number.parseInt(process.env.DB_PORT || '3306', 10);
  const connectionLimit = Number.parseInt(process.env.DB_POOL_LIMIT || '10', 10);

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number.isNaN(port) ? 3306 : port,
    database: process.env.DB_NAME || 'libreria_estudio',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: Number.isNaN(connectionLimit) ? 10 : connectionLimit,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };
}

/**
 * Returns the singleton mysql2/promise connection pool.
 * @returns {import('mysql2/promise').Pool}
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool(buildPoolConfig());
  }
  return pool;
}

/**
 * Executes a parameterized SQL query using the shared pool.
 * @param {string} sql
 * @param {Array<unknown>} [params=[]]
 * @returns {Promise<[unknown, unknown]>}
 */
async function query(sql, params = []) {
  return getPool().execute(sql, params);
}

/**
 * Acquires a dedicated connection from the pool for ACID transactions.
 * Caller must always release the connection in a finally block.
 * @returns {Promise<import('mysql2/promise').PoolConnection>}
 */
async function getConnection() {
  return getPool().getConnection();
}

/**
 * Verifies database connectivity for startup checks and /api/v1/health.
 * @returns {Promise<boolean>}
 */
async function pingDatabase() {
  const connection = await getPool().getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

/**
 * Gracefully closes all connections in the pool on shutdown.
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (pool) {
    const currentPool = pool;
    pool = null;
    await currentPool.end();
  }
}

module.exports = {
  getPool,
  query,
  getConnection,
  pingDatabase,
  closeDatabase
};
