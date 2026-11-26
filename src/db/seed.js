const { splitSqlStatements, readSqlDirectory, connectWithRetry } = require('./sqlRunner');
const { logger } = require('../utils/logger');

async function runSeeds() {
  const seeds = readSqlDirectory('seeds');
  const connection = await connectWithRetry();

  try {
    for (const seed of seeds) {
      const statements = splitSqlStatements(seed.sql);
      for (const statement of statements) {
        await connection.query(statement);
      }
      logger.info('Seed ejecutado correctamente', { filename: seed.filename });
    }

    const bootstrapAdminEmail = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
    if (bootstrapAdminEmail) {
      const [result] = await connection.query(
        "UPDATE users SET role = 'admin', is_active = 1 WHERE email = ?",
        [bootstrapAdminEmail]
      );
      logger.info('Promoción de administrador bootstrap evaluada', {
        updated: result && typeof result.affectedRows === 'number' ? result.affectedRows : 0
      });
    }

    logger.info('Carga inicial de datos completada', { totalFiles: seeds.length });
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Error al ejecutar seeds', { error: err.message });
      process.exit(1);
    });
}

module.exports = {
  runSeeds
};
