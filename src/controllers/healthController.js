const { pingDatabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');

async function getHealth(_req, res) {
  try {
    await pingDatabase();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Servicio operativo',
      data: {
        status: 'ok',
        database: 'connected',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  } catch (_err) {
    return sendError(res, {
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Base de datos no disponible'
    });
  }
}

module.exports = {
  getHealth
};
