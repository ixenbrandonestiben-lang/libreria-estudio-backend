const http = require('http');
const { env } = require('./config/env');
const { pingDatabase, closeDatabase } = require('./config/database');
const app = require('./app');
const releaseExpiredReservationsJob = require('./jobs/releaseExpiredReservationsJob');
const { logger } = require('./utils/logger');

let server = null;
let isShuttingDown = false;

async function startServer() {
  try {
    await pingDatabase();
    logger.info('Conexión a MySQL verificada correctamente');
  } catch (err) {
    logger.warn('No se pudo verificar MySQL al inicio; el servidor iniciará y reintentará en runtime', {
      error: err.message
    });
  }

  server = http.createServer(app);
  server.requestTimeout = 30000;
  server.headersTimeout = 35000;

  server.listen(env.port, () => {
    logger.info('Servidor Librería Estudio iniciado', {
      port: env.port,
      nodeEnv: env.nodeEnv,
      apiPrefix: env.apiPrefix
    });
    releaseExpiredReservationsJob.start();
  });

  server.on('error', (err) => {
    logger.error('Error en servidor HTTP', { error: err.message });
    process.exit(1);
  });
}

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info('Iniciando cierre elegante del servidor', { signal });
  releaseExpiredReservationsJob.stop();

  const forceExitTimer = setTimeout(() => {
    logger.error('Cierre forzado tras agotar tiempo de espera');
    process.exit(1);
  }, 10000);
  if (typeof forceExitTimer.unref === 'function') {
    forceExitTimer.unref();
  }

  try {
    if (server) {
      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections();
      }
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('Servidor HTTP cerrado');
    }

    await closeDatabase();
    logger.info('Pool de conexiones MySQL cerrado');

    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    logger.error('Error durante el cierre elegante', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', {
    error: reason instanceof Error ? reason.message : String(reason)
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message });
  gracefulShutdown('uncaughtException');
});

startServer();
