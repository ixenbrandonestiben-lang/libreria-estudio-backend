const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { sendError } = require('../utils/responseHelper');

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      return sendError(res, {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message
      });
    }
  });
}

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de autenticación. Por favor intenta de nuevo más tarde.'
});

const searchQuoteLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Límite de consultas de catálogo/cotización alcanzado. Intenta de nuevo en unos minutos.'
});

const supportLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Has enviado demasiadas solicitudes de soporte. Por favor espera unos minutos.'
});

const generalLimiter = createLimiter({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: 'Demasiadas peticiones desde esta IP. Por favor intenta más tarde.'
});

module.exports = {
  authLimiter,
  searchQuoteLimiter,
  supportLimiter,
  generalLimiter
};
