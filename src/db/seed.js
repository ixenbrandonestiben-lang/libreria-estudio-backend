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
