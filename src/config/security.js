const { env } = require('./env');
const { AppError } = require('../utils/appError');

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, healthchecks, server-to-server) without Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new AppError('Origen no autorizado por política CORS', 403, 'CORS_ORIGIN_DENIED')
    );
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cart-Token', 'X-Consent-Token'],
  exposedHeaders: ['X-Cart-Token', 'X-Consent-Token'],
  maxAge: 600
};

const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: env.isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true
      }
    : false,
  referrerPolicy: { policy: 'no-referrer' },
  xPoweredBy: false
};

function getCookieOptions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: maxAgeMs
  };
}

module.exports = {
  corsOptions,
  helmetOptions,
  getCookieOptions
};
