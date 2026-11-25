const LOG_LEVELS = Object.freeze({
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
});

const SENSITIVE_KEY_PATTERN =
  /password|token|authorization|secret|cookie|jwt|session|apikey|api_key|credit|card/i;

function getConfiguredLevel() {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, level) ? level : 'info';
}

function maskSensitiveData(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      code: value.code
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveData(item, depth + 1));
  }

  if (typeof value === 'object') {
    const masked = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = maskSensitiveData(val, depth + 1);
      }
    }
    return masked;
  }

  return value;
}

function writeLog(level, message, meta = undefined) {
  const configured = getConfiguredLevel();
  if (LOG_LEVELS[level] > LOG_LEVELS[configured]) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message
  };

  if (meta !== undefined) {
    entry.meta = maskSensitiveData(meta);
  }

  const serialized = JSON.stringify(entry);
  if (level === 'error') {
    process.stderr.write(`${serialized}\n`);
  } else {
    process.stdout.write(`${serialized}\n`);
  }
}

const logger = Object.freeze({
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  info: (message, meta) => writeLog('info', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),
  maskSensitiveData
});

module.exports = {
  logger,
  maskSensitiveData
};
