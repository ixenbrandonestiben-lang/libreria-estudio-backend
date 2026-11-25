const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const { env } = require('./config/env');
const { corsOptions, helmetOptions } = require('./config/security');
const { generalLimiter } = require('./middlewares/rateLimitMiddleware');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');
const healthRoutes = require('./routes/healthRoutes');
const apiV1Routes = require('./routes/index');

const app = express();

// Trust first proxy (Docker / reverse proxy / Dokploy)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security & HTTP hardening
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(compression());

// Body parsing with strict size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Root /health endpoint for Docker HEALTHCHECK compatibility
app.use('/health', healthRoutes);

// General rate limiter for API routes
app.use(env.apiPrefix, generalLimiter);

// Mount API v1 routes
app.use(env.apiPrefix, apiV1Routes);

// 404 and centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
