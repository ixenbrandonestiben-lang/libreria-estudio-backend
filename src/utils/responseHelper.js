/**
 * Sends a standardized success JSON response.
 * @param {import('express').Response} res
 * @param {{ statusCode?: number, message?: string, data?: unknown, meta?: unknown }} [options]
 */
function sendSuccess(res, { statusCode = 200, message = 'Operación exitosa', data = null, meta } = {}) {
  const payload = {
    success: true,
    message,
    data
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Sends a standardized error JSON response.
 * @param {import('express').Response} res
 * @param {{ statusCode?: number, code?: string, message?: string, details?: unknown }} [options]
 */
function sendError(
  res,
  { statusCode = 500, code = 'INTERNAL_ERROR', message = 'Error interno del servidor', details } = {}
) {
  const errorObj = {
    code,
    message
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorObj
  });
}

module.exports = {
  sendSuccess,
  sendError
};
