const { env } = require('../config/env');
const { logger } = require('../utils/logger');
const { sendError } = require('../utils/responseHelper');

function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, {
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'El cuerpo de la petición contiene JSON inválido'
    });
  }

  // MySQL duplicate entry
  if (err && err.code === 'ER_DUP_ENTRY') {
    return sendError(res, {
      statusCode: 409,
      code: 'CONFLICT',
      message: 'Ya existe un registro con los mismos datos únicos'
    });
  }

  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const code = err?.code && typeof err.code === 'string' && !err.sqlMessage ? err.code : 'INTERNAL_ERROR';
  const isServerError = statusCode >= 500;

  logger.error('Request error', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    message: err?.message,
    ...(env.isProduction ? {} : { stack: err?.stack })
  });

  const safeMessage =
    isServerError && env.isProduction
      ? 'Error interno del servidor. Intenta nuevamente más tarde.'
      : err?.message || 'Error interno del servidor';

  const details =
    !env.isProduction && err?.details !== undefined
      ? err.details
      : err?.isOperational && err?.details !== undefined
        ? err.details
        : undefined;

  return sendError(res, {
    statusCode,
    code: isServerError && err?.sqlMessage ? 'DATABASE_ERROR' : code,
    message: safeMessage,
    details
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
