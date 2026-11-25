const {
  IDEMPOTENT_SQL_ERRNOS,
  splitSqlStatements,
  readSqlDirectory,
  connectWithRetry
} = require('./sqlRunner');
const { logger } = require('../utils/logger');

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function runMigrations() {
  const migrations = readSqlDirectory('migrations');
  const connection = await connectWithRetry();

  try {
    await ensureMigrationsTable(connection);
    const [appliedRows] = await connection.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedRows.map((row) => row.filename));

    let executedCount = 0;
    for (const migration of migrations) {
      if (applied.has(migration.filename)) {
        continue;
      }

      const statements = splitSqlStatements(migration.sql);
      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (err) {
          if (IDEMPOTENT_SQL_ERRNOS.has(err.errno)) {
            logger.debug('Objeto SQL ya existente en migración idempotente', {
              filename: migration.filename,
              errno: err.errno
            });
            continue;
          }
          throw err;
        }
      }

      await connection.execute(
        'INSERT IGNORE INTO schema_migrations (filename) VALUES (?)',
        [migration.filename]
      );
      executedCount += 1;
      logger.info('Migración aplicada correctamente', { filename: migration.filename });
    }

    logger.info('Proceso de migraciones completado', {
      totalFiles: migrations.length,
      newlyApplied: executedCount
    });
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Error al ejecutar migraciones', { error: err.message });
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
