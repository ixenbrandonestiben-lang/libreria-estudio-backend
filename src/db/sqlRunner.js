const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

const IDEMPOTENT_SQL_ERRNOS = new Set([
  1050, // ER_TABLE_EXISTS_ERROR
  1060, // ER_DUP_FIELDNAME
  1061, // ER_DUP_KEYNAME
  1091, // ER_CANT_DROP_FIELD_OR_KEY
  1826, // ER_FK_DUP_NAME
  3822 // ER_CHECK_CONSTRAINT_DUP_NAME
]);

/**
 * Splits a SQL script into individual statements while respecting quoted strings and line comments.
 * @param {string} sql
 * @returns {string[]}
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        i += 1;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i += 1;
        continue;
      }
    }

    if (ch === '\\' && (inSingle || inDouble)) {
      current += ch;
      if (i + 1 < sql.length) {
        current += sql[i + 1];
        i += 1;
      }
      continue;
    }

    if (ch === "'" && !inDouble && !inBacktick) {
      if (inSingle && next === "'") {
        current += "''";
        i += 1;
        continue;
      }
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
    } else if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  const trailing = current.trim();
  if (trailing) {
    statements.push(trailing);
  }

  return statements;
}

/**
 * Reads sorted .sql filenames from a directory under database/.
 * @param {string} subdir
 * @returns {Array<{ filename: string, fullPath: string, sql: string }>}
 */
function readSqlDirectory(subdir) {
  const dirPath = path.resolve(__dirname, '../../database', subdir);
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directorio SQL no encontrado: ${dirPath}`);
  }

  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((filename) => {
      const fullPath = path.join(dirPath, filename);
      return {
        filename,
        fullPath,
        sql: fs.readFileSync(fullPath, 'utf8')
      };
    });
}

/**
 * Opens a MySQL connection with brief exponential backoff retries for container startup.
 * @param {number} [maxAttempts=5]
 * @returns {Promise<import('mysql2/promise').Connection>}
 */
async function connectWithRetry(maxAttempts = 5) {
  const db = (env && env.db) || {};
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const connection = await mysql.createConnection({
        host: db.host || '127.0.0.1',
        port: db.port || 3306,
        database: db.name || 'libreria_estudio',
        user: db.user || 'libreria_user',
        password: db.password || '',
        charset: 'utf8mb4',
        timezone: 'Z',
        multipleStatements: true
      });
      return connection;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delayMs = attempt * 1500;
        logger.warn('Esperando conexión a MySQL para ejecutar SQL', {
          attempt,
          maxAttempts,
          delayMs,
          error: err.message
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

module.exports = {
  IDEMPOTENT_SQL_ERRNOS,
  splitSqlStatements,
  readSqlDirectory,
  connectWithRetry
};
