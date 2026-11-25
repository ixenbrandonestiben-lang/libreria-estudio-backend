process.env.NODE_ENV = 'test';

const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

// Pre-seed config modules in require.cache so unit tests run without node_modules (mysql2/dotenv/nodemailer) or MySQL
function seedModuleCache(relativePath, exportsValue) {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue
  };
}

seedModuleCache('../src/config/database', {
  getPool: () => ({}),
  query: async () => [[], []],
  getConnection: async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {}
  }),
  pingDatabase: async () => true,
  closeDatabase: async () => {}
});

seedModuleCache('../src/config/env', {
  env: {
    nodeEnv: 'test',
    isProduction: false,
    isTest: true,
    db: {
      host: '127.0.0.1',
      port: 3306,
      name: 'libreria_estudio',
      user: 'libreria_user',
      password: ''
    },
    mail: { from: 'test@libreria.local' },
    reservations: { ttlMinutes: 20 }
  },
  validateEnv: () => {}
});

seedModuleCache('../src/config/mail', {
  getMailTransporter: () => ({
    sendMail: async () => ({ messageId: 'mock-id' })
  })
});

const {
  trimString,
  normalizeEmail,
  escapeLike,
  cleanText,
  normalizeForMatching
} = require('../src/utils/sanitizer');
const { sendSuccess, sendError } = require('../src/utils/responseHelper');
const { maskSensitiveData } = require('../src/utils/logger');
const { termsAcceptanceMiddleware } = require('../src/middlewares/termsAcceptanceMiddleware');
const orderModel = require('../src/models/orderModel');
const productModel = require('../src/models/productModel');
const userModel = require('../src/models/userModel');
const supportModel = require('../src/models/supportModel');
const { requireRole } = require('../src/middlewares/roleMiddleware');
const adminService = require('../src/services/adminService');
const { transitionOrderStatus, ORDER_STATUS } = require('../src/services/orderService');
const {
  quoteSchoolList,
  parseRawLine,
  extractTechnicalAttributes
} = require('../src/services/schoolListService');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

function loadErrorMiddlewareWithEnv(envOverrides) {
  const envPath = require.resolve('../src/config/env');
  const errMwPath = require.resolve('../src/middlewares/errorMiddleware');
  const originalEnvCache = require.cache[envPath];
  const originalErrMwCache = require.cache[errMwPath];

  delete require.cache[errMwPath];
  require.cache[envPath] = {
    id: envPath,
    filename: envPath,
    loaded: true,
    exports: {
      env: {
        nodeEnv: 'production',
        isProduction: true,
        isTest: false,
        ...envOverrides
      }
    }
  };

  const loaded = require('../src/middlewares/errorMiddleware');

  // Restore cache immediately so other tests are unaffected
  if (originalEnvCache) {
    require.cache[envPath] = originalEnvCache;
  } else {
    delete require.cache[envPath];
  }
  if (originalErrMwCache) {
    require.cache[errMwPath] = originalErrMwCache;
  } else {
    delete require.cache[errMwPath];
  }

  return loaded;
}

describe('sanitizer.js', () => {
  it('trimString trims whitespace and handles null/undefined safely', () => {
    assert.equal(trimString('  hola mundo  '), 'hola mundo');
    assert.equal(trimString(null), '');
    assert.equal(trimString(undefined), '');
    assert.equal(trimString(123), '123');
  });

  it('normalizeEmail trims and lowercases emails', () => {
    assert.equal(normalizeEmail('  Usuario@Ejemplo.COM  '), 'usuario@ejemplo.com');
  });

  it('escapeLike escapes SQL LIKE wildcards (%, _, \\)', () => {
    assert.equal(escapeLike('  100%_test\\path  '), '100\\%\\_test\\\\path');
    assert.equal(escapeLike('cuaderno'), 'cuaderno');
  });

  it('cleanText removes control characters and collapses excess spaces/tabs', () => {
    assert.equal(cleanText('  hola\u0000\u0007   mundo\t\tlibre\u007F  '), 'hola mundo libre');
    assert.equal(cleanText(null), '');
  });

  it('normalizeForMatching strips accents and lowercases text', () => {
    assert.equal(
      normalizeForMatching('  Cuaderno Académico Útil  '),
      'cuaderno academico util'
    );
  });
});

describe('responseHelper.js', () => {
  it('sendSuccess formats { success: true, message, data } and optional meta', () => {
    const res = createMockRes();
    sendSuccess(res, {
      statusCode: 201,
      message: 'Creado',
      data: { id: 42 },
      meta: { total: 1 }
    });

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      success: true,
      message: 'Creado',
      data: { id: 42 },
      meta: { total: 1 }
    });
  });

  it('sendError formats { success: false, error: { code, message } }', () => {
    const res = createMockRes();
    sendError(res, {
      statusCode: 400,
      code: 'BAD_INPUT',
      message: 'Datos inválidos'
    });

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      success: false,
      error: {
        code: 'BAD_INPUT',
        message: 'Datos inválidos'
      }
    });
  });
});

describe('logger.js', () => {
  it('maskSensitiveData redacts password, token, authorization recursively', () => {
    const input = {
      user: 'ana@ejemplo.com',
      password: 'mi-password-secreto',
      token: 'eyJhbGciOiJIUzI1NiJ9',
      headers: {
        Authorization: 'Bearer secret-jwt',
        'x-request-id': 'req-123'
      },
      items: [{ api_key: '12345', name: 'Cuaderno' }]
    };

    const masked = maskSensitiveData(input);
    assert.equal(masked.user, 'ana@ejemplo.com');
    assert.equal(masked.password, '[REDACTED]');
    assert.equal(masked.token, '[REDACTED]');
    assert.equal(masked.headers.Authorization, '[REDACTED]');
    assert.equal(masked.headers['x-request-id'], 'req-123');
    assert.equal(masked.items[0].api_key, '[REDACTED]');
    assert.equal(masked.items[0].name, 'Cuaderno');
  });

  it('maskSensitiveData serializes Error without stack trace', () => {
    const err = new Error('Fallo de conexión');
    err.code = 'ECONNREFUSED';
    const masked = maskSensitiveData(err);

    assert.deepEqual(masked, {
      name: 'Error',
      message: 'Fallo de conexión',
      code: 'ECONNREFUSED'
    });
    assert.equal('stack' in masked, false);
  });
});

describe('termsAcceptanceMiddleware.js', () => {
  it('rejects with 400 TERMS_NOT_ACCEPTED when termsAccepted is not strictly true', () => {
    for (const body of [undefined, {}, { termsAccepted: false }, { termsAccepted: 'true' }]) {
      const req = { body };
      const res = createMockRes();
      let nextCalled = false;

      termsAcceptanceMiddleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.body, {
        success: false,
        error: {
          code: 'TERMS_NOT_ACCEPTED',
          message: 'Debes aceptar los Términos y Condiciones para continuar.'
        }
      });
    }
  });

  it('calls next() when termsAccepted === true or terms_accepted === true', () => {
    for (const body of [{ termsAccepted: true }, { terms_accepted: true }]) {
      const req = { body };
      const res = createMockRes();
      let nextCalled = false;

      termsAcceptanceMiddleware(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(res.body, null);
    }
  });
});

describe('errorMiddleware.js', () => {
  it('in production does not expose stack trace or SQL details on 500 errors', () => {
    const { errorHandler } = loadErrorMiddlewareWithEnv({ isProduction: true, nodeEnv: 'production' });
    const req = { method: 'POST', originalUrl: '/api/v1/orders' };
    const res = createMockRes();

    const sqlError = new Error('You have an error in your SQL syntax near SELECT * FROM users');
    sqlError.sqlMessage = 'Unknown column foo in field list';
    sqlError.sql = 'SELECT foo FROM users';
    sqlError.stack = 'Error: SQL syntax\n    at Query.execute (/app/src/models/userModel.js:12:5)';

    // Silence stderr from logger.error during test
    const writeMock = mock.method(process.stderr, 'write', () => true);
    try {
      errorHandler(sqlError, req, res, () => {});
    } finally {
      writeMock.mock.restore();
    }

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'DATABASE_ERROR');
    assert.equal(
      res.body.error.message,
      'Error interno del servidor. Intenta nuevamente más tarde.'
    );
    assert.equal(res.body.error.details, undefined);
    assert.equal(JSON.stringify(res.body).includes('SELECT'), false);
    assert.equal(JSON.stringify(res.body).includes('userModel.js'), false);
  });

  it('handles malformed JSON SyntaxError as 400 INVALID_JSON and ER_DUP_ENTRY as 409 CONFLICT', () => {
    const { errorHandler, notFoundHandler } = loadErrorMiddlewareWithEnv({ isProduction: true });
    const req = { method: 'POST', originalUrl: '/api/v1/auth/login' };

    const resJson = createMockRes();
    const syntaxErr = new SyntaxError('Unexpected token');
    syntaxErr.status = 400;
    syntaxErr.body = '{bad';
    errorHandler(syntaxErr, req, resJson, () => {});
    assert.equal(resJson.statusCode, 400);
    assert.equal(resJson.body.error.code, 'INVALID_JSON');

    const resDup = createMockRes();
    const dupErr = new Error('Duplicate entry');
    dupErr.code = 'ER_DUP_ENTRY';
    errorHandler(dupErr, req, resDup, () => {});
    assert.equal(resDup.statusCode, 409);
    assert.equal(resDup.body.error.code, 'CONFLICT');

    const res404 = createMockRes();
    notFoundHandler(req, res404);
    assert.equal(res404.statusCode, 404);
    assert.equal(res404.body.error.code, 'NOT_FOUND');
  });
});

describe('orderService.js - state machine transitions', () => {
  it('allows valid state transitions', async (t) => {
    const updateMock = t.mock.method(orderModel, 'updateStatus', async () => true);

    const validPairs = [
      [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID],
      [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING],
      [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED],
      [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED, ORDER_STATUS.REFUNDED]
    ];

    for (const [from, to] of validPairs) {
      const result = await transitionOrderStatus(10, from, to);
      assert.deepEqual(result, {
        orderId: 10,
        previousStatus: from,
        status: to
      });
    }

    assert.equal(updateMock.mock.calls.length, validPairs.length);
  });

  it('rejects invalid state transitions with 400 INVALID_ORDER_TRANSITION', async (t) => {
    const updateMock = t.mock.method(orderModel, 'updateStatus', async () => true);

    const invalidPairs = [
      [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.CANCELLED, ORDER_STATUS.PAID],
      [ORDER_STATUS.REFUNDED, ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED, ORDER_STATUS.SHIPPED]
    ];

    for (const [from, to] of invalidPairs) {
      await assert.rejects(
        () => transitionOrderStatus(10, from, to),
        (err) => err.statusCode === 400 && err.code === 'INVALID_ORDER_TRANSITION'
      );
    }

    assert.equal(updateMock.mock.calls.length, 0);
  });

  it('throws 404 ORDER_NOT_FOUND when orderModel.updateStatus returns false', async (t) => {
    t.mock.method(orderModel, 'updateStatus', async () => false);

    await assert.rejects(
      () => transitionOrderStatus(999, ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING),
      (err) => err.statusCode === 404 && err.code === 'ORDER_NOT_FOUND'
    );
  });
});

describe('schoolListService.js - normalization and classification', () => {
  it('parseRawLine extracts leading/trailing quantities and cleans numbering', () => {
    assert.deepEqual(parseRawLine('1. 2x Cuaderno A4 cuadriculado'), {
      originalLine: '1. 2x Cuaderno A4 cuadriculado',
      description: 'Cuaderno A4 cuadriculado',
      quantity: 2
    });

    assert.deepEqual(parseRawLine('- Lapicero azul x3'), {
      originalLine: '- Lapicero azul x3',
      description: 'Lapicero azul',
      quantity: 3
    });

    assert.equal(parseRawLine('   '), null);
  });

  it('extractTechnicalAttributes extracts ruling, sheets, format, ink, and education level', () => {
    const attrs = extractTechnicalAttributes(
      'Cuaderno A4 cuadriculado 100 hojas 75g primaria'
    );
    assert.deepEqual(attrs, {
      ruling_type: 'cuadriculado',
      sheet_count: '100',
      paper_weight_gsm: '75',
      format_size: 'A4',
      education_level: 'primaria'
    });
  });

  it('quoteSchoolList classifies exact_match, alternative, out_of_stock, and not_found', async (t) => {
    t.mock.method(productModel, 'findCandidatesForSchoolList', async (keywords) => {
      if (keywords.includes('inexistente')) {
        return [];
      }
      if (keywords.includes('agotado')) {
        return [{ id: 2, title: 'Marcador Agotado', price: '25.00', stock_available: 0 }];
      }
      if (keywords.includes('regla')) {
        return [{ id: 3, title: 'Escuadra Escolar', price: '18.00', stock_available: 10 }];
      }
      return [
        {
          id: 1,
          title: 'Cuaderno A4 Cuadriculado 100 Hojas',
          price: '45.00',
          stock_available: 20
        }
      ];
    });

    t.mock.method(productModel, 'findAttributesByProductIds', async () => ({
      1: [
        { key: 'ruling_type', value: 'cuadriculado' },
        { key: 'format_size', value: 'A4' }
      ],
      2: [],
      3: []
    }));

    const quote = await quoteSchoolList({
      rawText: [
        '2 Cuaderno A4 cuadriculado',
        '1 Regla flexible',
        '1 Marcador agotado',
        '1 Producto inexistente'
      ].join('\n')
    });

    assert.equal(quote.items.length, 4);
    assert.equal(quote.items[0].matchStatus, 'exact_match');
    assert.equal(quote.items[0].lineEstimatedTotal, '90.00');
    assert.equal(quote.items[1].matchStatus, 'alternative');
    assert.equal(quote.items[1].lineEstimatedTotal, '18.00');
    assert.equal(quote.items[2].matchStatus, 'out_of_stock');
    assert.equal(quote.items[2].lineEstimatedTotal, '0.00');
    assert.equal(quote.items[3].matchStatus, 'not_found');
    assert.equal(quote.items[3].lineEstimatedTotal, '0.00');

    assert.deepEqual(quote.summary, {
      totalItems: 4,
      exactMatches: 1,
      alternatives: 1,
      outOfStock: 1,
      notFound: 1,
      estimatedSubtotal: '108.00'
    });
  });
});

describe('env.js - configuration validation', () => {
  it('allows local development startup without .env and enforces strict checks in production', () => {
    const dotenvPath = (() => {
      try {
        return require.resolve('dotenv');
      } catch {
        return null;
      }
    })();

    const fakeDotenvId = dotenvPath || '/virtual/dotenv/index.js';
    const Module = require('node:module');
    const originalResolve = Module._resolveFilename;
    const prevDotenvCache = require.cache[fakeDotenvId];
    const envFilePath = require.resolve('../src/config/env');
    const prevEnvCache = require.cache[envFilePath];
    const savedEnv = { ...process.env };

    Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
      if (request === 'dotenv' && !dotenvPath) {
        return fakeDotenvId;
      }
      return originalResolve.call(this, request, parent, isMain, options);
    };

    require.cache[fakeDotenvId] = {
      id: fakeDotenvId,
      filename: fakeDotenvId,
      loaded: true,
      exports: { config: () => ({}) }
    };

    try {
      // Development without DB_NAME / DB_USER / JWT_SECRET
      delete process.env.NODE_ENV;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.JWT_SECRET;
      delete process.env.CORS_ORIGIN;
      delete require.cache[envFilePath];

      const devLoaded = require('../src/config/env');
      assert.equal(devLoaded.env.nodeEnv, 'development');
      assert.equal(devLoaded.env.db.name, 'libreria_estudio');
      assert.equal(devLoaded.env.db.user, 'libreria_user');
      assert.ok(devLoaded.env.jwt.secret.length >= 32);

      // Production with CHANGE_ME placeholders must throw
      process.env.NODE_ENV = 'production';
      process.env.DB_NAME = 'libreria_estudio';
      process.env.DB_USER = 'libreria_user';
      process.env.DB_PASSWORD = 'CHANGE_ME_STRONG_DB_PASSWORD';
      process.env.JWT_SECRET = 'CHANGE_ME_MIN_64_CHARS_RANDOM_HEX';
      process.env.CORS_ORIGIN = '*';
      assert.throws(() => devLoaded.validateEnv(), /Error de configuración de entorno/);

      // Production with valid config passes
      process.env.DB_PASSWORD = 'RealStrongDbPassword123!';
      process.env.JWT_SECRET = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';
      process.env.CORS_ORIGIN = 'http://localhost:8080';
      assert.doesNotThrow(() => devLoaded.validateEnv());
    } finally {
      Module._resolveFilename = originalResolve;
      for (const k of Object.keys(process.env)) {
        if (!(k in savedEnv)) {
          delete process.env[k];
        }
      }
      Object.assign(process.env, savedEnv);
      if (prevDotenvCache) {
        require.cache[fakeDotenvId] = prevDotenvCache;
      } else {
        delete require.cache[fakeDotenvId];
      }
      if (prevEnvCache) {
        require.cache[envFilePath] = prevEnvCache;
      } else {
        delete require.cache[envFilePath];
      }
    }
  });
});

describe('sqlRunner.js - SQL parsing and database directory integrity', () => {
  it('splitSqlStatements splits statements accurately while preserving quoted semicolons', () => {
    const fakeMysqlId = '/virtual/mysql2/promise.js';
    const Module = require('node:module');
    const originalResolve = Module._resolveFilename;
    Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
      if (request === 'mysql2/promise') {
        return fakeMysqlId;
      }
      return originalResolve.call(this, request, parent, isMain, options);
    };
    require.cache[fakeMysqlId] = {
      id: fakeMysqlId,
      filename: fakeMysqlId,
      loaded: true,
      exports: { createConnection: async () => ({}) }
    };

    try {
      const { splitSqlStatements, readSqlDirectory } = require('../src/db/sqlRunner');
      const stmts = splitSqlStatements(`
        -- Comentario con ; punto y coma
        SET NAMES utf8mb4;
        INSERT INTO faq_items (question) VALUES ('¿Funciona; bien?');
        /* bloque ; comentario */
        CREATE INDEX idx_test ON items (id);
      `);
      assert.equal(stmts.length, 3);
      assert.equal(stmts[0], 'SET NAMES utf8mb4');
      assert.match(stmts[1], /'¿Funciona; bien\?'/);
      assert.equal(stmts[2], 'CREATE INDEX idx_test ON items (id)');

      const migrations = readSqlDirectory('migrations');
      const seeds = readSqlDirectory('seeds');
      assert.equal(migrations.length, 6);
      assert.equal(seeds.length, 3);
    } finally {
      Module._resolveFilename = originalResolve;
      delete require.cache[fakeMysqlId];
    }
  });

  it('runMigrations applies pending migrations idempotently and runSeeds executes seed scripts', async () => {
    const fakeMysqlId = '/virtual/mysql2/promise-migrate.js';
    const Module = require('node:module');
    const originalResolve = Module._resolveFilename;

    const executedSql = [];
    const insertedMigrations = [];
    let ended = false;

    const fakeConn = {
      async query(sql) {
        executedSql.push(sql);
        if (sql === 'SELECT filename FROM schema_migrations') {
          return [[{ filename: '001_create_users_and_addresses.sql' }]];
        }
        if (sql.includes('CREATE INDEX idx_products_category_active')) {
          const err = new Error('Duplicate key name');
          err.errno = 1061;
          throw err;
        }
        return [[]];
      },
      async execute(sql, params) {
        if (sql.includes('INSERT IGNORE INTO schema_migrations')) {
          insertedMigrations.push(params[0]);
        }
        return [{}];
      },
      async end() {
        ended = true;
      }
    };

    Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
      if (request === 'mysql2/promise') {
        return fakeMysqlId;
      }
      return originalResolve.call(this, request, parent, isMain, options);
    };
    require.cache[fakeMysqlId] = {
      id: fakeMysqlId,
      filename: fakeMysqlId,
      loaded: true,
      exports: { createConnection: async () => fakeConn }
    };

    const sqlRunnerPath = require.resolve('../src/db/sqlRunner');
    const migratePath = require.resolve('../src/db/migrate');
    const seedPath = require.resolve('../src/db/seed');
    delete require.cache[sqlRunnerPath];
    delete require.cache[migratePath];
    delete require.cache[seedPath];

    try {
      const { runMigrations } = require('../src/db/migrate');
      const { runSeeds } = require('../src/db/seed');

      await runMigrations();
      assert.equal(ended, true);
      assert.equal(insertedMigrations.includes('001_create_users_and_addresses.sql'), false);
      assert.equal(insertedMigrations.includes('006_create_indexes_and_constraints.sql'), true);
      assert.equal(insertedMigrations.length, 5);

      ended = false;
      const beforeSeedCount = executedSql.length;
      await runSeeds();
      assert.equal(ended, true);
      assert.ok(executedSql.length > beforeSeedCount);
    } finally {
      Module._resolveFilename = originalResolve;
      delete require.cache[fakeMysqlId];
      delete require.cache[sqlRunnerPath];
      delete require.cache[migratePath];
      delete require.cache[seedPath];
    }
  });
});

describe('roleMiddleware.js - requireRole("admin")', () => {
  it('passes 401 UNAUTHORIZED to next() when req.user is missing', () => {
    const middleware = requireRole('admin');
    let capturedErr = null;

    middleware({}, {}, (err) => {
      capturedErr = err;
    });

    assert.ok(capturedErr);
    assert.equal(capturedErr.statusCode, 401);
    assert.equal(capturedErr.code, 'UNAUTHORIZED');
  });

  it('passes 403 FORBIDDEN to next() when user role is not admin', () => {
    const middleware = requireRole('admin');
    let capturedErr = null;

    middleware({ user: { id: 2, role: 'customer' } }, {}, (err) => {
      capturedErr = err;
    });

    assert.ok(capturedErr);
    assert.equal(capturedErr.statusCode, 403);
    assert.equal(capturedErr.code, 'FORBIDDEN');
  });

  it('calls next() with no arguments when user role is admin', () => {
    const middleware = requireRole('admin');
    let nextCalled = false;
    let capturedErr;

    middleware({ user: { id: 1, role: 'admin' } }, {}, (err) => {
      nextCalled = true;
      capturedErr = err;
    });

    assert.equal(nextCalled, true);
    assert.equal(capturedErr, undefined);
  });
});

describe('adminService.js', () => {
  it('listUsers sanitizes search query and delegates to userModel.findAllForAdmin', async (t) => {
    const spy = t.mock.method(userModel, 'findAllForAdmin', async (filters) => ({
      items: [{ id: 1, email: 'admin@libreria.local', role: 'admin' }],
      pagination: { page: filters.page || 1, limit: filters.limit || 20, total: 1, totalPages: 1 }
    }));

    const result = await adminService.listUsers({ page: 2, limit: 10, q: '  ana_100%  ' });
    assert.equal(spy.mock.calls.length, 1);
    assert.deepEqual(spy.mock.calls[0].arguments[0], {
      page: 2,
      limit: 10,
      q: 'ana\\_100\\%'
    });
    assert.equal(result.items.length, 1);
  });

  it('updateUserRoleAndStatus forbids self role downgrade or self deactivation with 400 SELF_ROLE_CHANGE_FORBIDDEN', async (t) => {
    const updateSpy = t.mock.method(userModel, 'updateRoleAndStatus', async () => ({ id: 1 }));

    await assert.rejects(
      () => adminService.updateUserRoleAndStatus(1, 1, { role: 'customer' }),
      (err) => err.statusCode === 400 && err.code === 'SELF_ROLE_CHANGE_FORBIDDEN'
    );

    await assert.rejects(
      () => adminService.updateUserRoleAndStatus(1, '1', { isActive: false }),
      (err) => err.statusCode === 400 && err.code === 'SELF_ROLE_CHANGE_FORBIDDEN'
    );

    assert.equal(updateSpy.mock.calls.length, 0);
  });

  it('updateUserRoleAndStatus updates another user and throws 404 USER_NOT_FOUND when missing', async (t) => {
    t.mock.method(userModel, 'updateRoleAndStatus', async (userId) => {
      if (userId === 999) return null;
      return { id: userId, role: 'admin', is_active: 1 };
    });

    const updated = await adminService.updateUserRoleAndStatus(1, 5, { role: 'admin', isActive: true });
    assert.deepEqual(updated, { id: 5, role: 'admin', is_active: 1 });

    await assert.rejects(
      () => adminService.updateUserRoleAndStatus(1, 999, { role: 'customer' }),
      (err) => err.statusCode === 404 && err.code === 'USER_NOT_FOUND'
    );
  });

  it('listProducts, createProduct, and updateProduct manage catalog items and handle 404', async (t) => {
    t.mock.method(productModel, 'findAllForAdmin', async () => ({
      items: [{ id: 10, title: 'Cuaderno Inactivo', is_active: 0 }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    }));
    const createSpy = t.mock.method(productModel, 'createProduct', async (payload) => ({
      id: 11,
      ...payload
    }));
    t.mock.method(productModel, 'updateProduct', async (productId, payload) => {
      if (productId === 999) return null;
      return { id: productId, ...payload };
    });

    const list = await adminService.listProducts({ page: 1, limit: 20 });
    assert.equal(list.items[0].is_active, 0);

    const created = await adminService.createProduct({
      categoryId: 1,
      brandId: 2,
      sku: 'CUAD-100',
      title: '  Cuaderno Profesional  ',
      slug: 'cuaderno-profesional',
      shortDescription: 'Cuaderno de 100 hojas',
      price: 45.5,
      stockAvailable: 30
    });
    assert.equal(createSpy.mock.calls.length, 1);
    assert.equal(created.price, '45.50');
    assert.equal(created.title, 'Cuaderno Profesional');

    const updated = await adminService.updateProduct(11, { price: 49, isActive: false });
    assert.equal(updated.price, '49.00');
    assert.equal(updated.isActive, false);

    await assert.rejects(
      () => adminService.updateProduct(999, { price: 10 }),
      (err) => err.statusCode === 404 && err.code === 'PRODUCT_NOT_FOUND'
    );
  });

  it('listOrders, listTickets, and updateTicketStatus delegate cleanly and throw 404 on missing ticket', async (t) => {
    t.mock.method(orderModel, 'findAllForAdmin', async () => ({
      items: [{ id: 1, order_number: 'ORD-001', status: 'paid' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    }));
    t.mock.method(supportModel, 'findAllTicketsForAdmin', async () => ({
      items: [{ id: 1, ticket_code: 'SUP-20261125-ABC123', status: 'open' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    }));
    t.mock.method(supportModel, 'updateTicketStatus', async (ticketCode) => {
      return ticketCode === 'SUP-20261125-ABC123';
    });

    const orders = await adminService.listOrders({ page: 1, limit: 20, status: 'paid' });
    assert.equal(orders.items[0].order_number, 'ORD-001');

    const tickets = await adminService.listTickets({ page: 1, limit: 20, status: 'open' });
    assert.equal(tickets.items[0].ticket_code, 'SUP-20261125-ABC123');

    const ticketUpdate = await adminService.updateTicketStatus('SUP-20261125-ABC123', 'resolved');
    assert.deepEqual(ticketUpdate, { ticketCode: 'SUP-20261125-ABC123', status: 'resolved' });

    await assert.rejects(
      () => adminService.updateTicketStatus('SUP-MISSING', 'closed'),
      (err) => err.statusCode === 404 && err.code === 'TICKET_NOT_FOUND'
    );
  });
});
