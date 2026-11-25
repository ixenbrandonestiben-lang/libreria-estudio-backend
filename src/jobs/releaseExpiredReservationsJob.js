const { env } = require('../config/env');
const inventoryService = require('../services/inventoryService');
const { logger } = require('../utils/logger');

let intervalHandle = null;
let isRunning = false;

async function runOnce() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  try {
    await inventoryService.releaseExpiredReservationsBatch(100);
  } catch (err) {
    logger.error('Fallo en job de liberación de reservas expiradas', { error: err.message });
  } finally {
    isRunning = false;
  }
}

function start() {
  if (intervalHandle) {
    return;
  }

  const intervalMs = env.reservations.cleanupIntervalMs;
  intervalHandle = setInterval(runOnce, intervalMs);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  logger.info('Job de liberación de reservas expiradas iniciado', { intervalMs });
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('Job de liberación de reservas expiradas detenido');
  }
}

module.exports = {
  start,
  stop,
  runOnce
};
