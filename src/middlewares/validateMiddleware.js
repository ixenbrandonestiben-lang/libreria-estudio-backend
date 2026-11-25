const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHelper');

/**
 * Evaluates express-validator rules and returns 400 VALIDATION_ERROR on failure.
 */
function validateMiddleware(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((err) => ({
    field: err.path || err.param || 'unknown',
    message: err.msg
  }));

  return sendError(res, {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Error de validación en los datos enviados',
    details
  });
}

module.exports = {
  validateMiddleware
};
