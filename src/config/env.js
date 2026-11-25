const dotenv = require('dotenv');

dotenv.config();

const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function isPlaceholder(value) {
  if (!value) {
    return true;
  }
  return String(value).trim().toUpperCase().startsWith('CHANGE_ME');
}

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const errors = [];

  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    errors.push(`NODE_ENV inválido: "${nodeEnv}". Debe ser development, test o production.`);
  }

  const port = parsePositiveInt(process.env.PORT, 3000);
  if (port < 1 || port > 65535) {
    errors.push(`PORT inválido: "${process.env.PORT}".`);
  }

  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbName = process.env.DB_NAME || '';
  const dbUser = process.env.DB_USER || '';
  const dbPassword = process.env.DB_PASSWORD || '';
  const jwtSecret = process.env.JWT_SECRET || '';

  if (nodeEnv !== 'test') {
    if (!dbHost.trim()) {
      errors.push('DB_HOST es obligatorio.');
    }
    if (!dbName.trim()) {
      errors.push('DB_NAME es obligatorio.');
    }
    if (!dbUser.trim()) {
      errors.push('DB_USER es obligatorio.');
    }
    if (!jwtSecret.trim()) {
      errors.push('JWT_SECRET es obligatorio.');
    }
  }

  if (nodeEnv === 'production') {
    if (!dbPassword || isPlaceholder(dbPassword)) {
      errors.push('DB_PASSWORD debe estar configurado con un valor seguro en producción.');
    }
    if (!jwtSecret || isPlaceholder(jwtSecret) || jwtSecret.length < 32) {
      errors.push('JWT_SECRET debe tener al menos 32 caracteres y no ser un marcador en producción.');
    }
    const corsOrigin = (process.env.CORS_ORIGIN || '').trim();
    if (!corsOrigin || corsOrigin === '*') {
      errors.push('CORS_ORIGIN debe restringirse a orígenes autorizados en producción (no "*").');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Error de configuración de entorno:\n- ${errors.join('\n- ')}`);
  }
}

validateEnv();

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
  port: parsePositiveInt(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  db: Object.freeze({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parsePositiveInt(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'libreria_estudio',
    user: process.env.DB_USER || 'libreria_user',
    password: process.env.DB_PASSWORD || '',
    poolLimit: parsePositiveInt(process.env.DB_POOL_LIMIT, 10)
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || 'test-only-jwt-secret-placeholder-32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  }),
  bcryptRounds: Math.min(14, Math.max(10, parsePositiveInt(process.env.BCRYPT_ROUNDS, 12))),
  corsOrigins,
  rateLimit: Object.freeze({
    windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parsePositiveInt(process.env.RATE_LIMIT_MAX, 100)
  }),
  reservations: Object.freeze({
    ttlMinutes: parsePositiveInt(process.env.RESERVATION_TTL_MINUTES, 20),
    cleanupIntervalMs: parsePositiveInt(process.env.RESERVATION_CLEANUP_INTERVAL_MS, 60 * 1000)
  }),
  mail: Object.freeze({
    host: process.env.SMTP_HOST || '',
    port: parsePositiveInt(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Librería Estudio <no-reply@libreriaestudio.local>'
  }),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080'
});

module.exports = {
  env,
  validateEnv
};
