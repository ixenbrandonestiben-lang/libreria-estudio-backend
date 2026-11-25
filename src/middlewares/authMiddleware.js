const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const userModel = require('../models/userModel');
const { AppError } = require('../utils/appError');

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  return parts[1];
}

async function resolveUserFromToken(token) {
  const decoded = jwt.verify(token, env.jwt.secret);
  const userId = Number(decoded.sub || decoded.userId);
  if (!userId || Number.isNaN(userId)) {
    throw AppError.unauthorized('Token inválido', 'INVALID_TOKEN');
  }

  const user = await userModel.findById(userId);
  if (!user || !user.is_active) {
    throw AppError.unauthorized('Usuario no encontrado o inactivo', 'USER_INACTIVE');
  }

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}

/**
 * Requires a valid JWT Bearer token and active user account.
 */
async function authMiddleware(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next(AppError.unauthorized('Token de autenticación requerido', 'TOKEN_REQUIRED'));
    }

    req.user = await resolveUserFromToken(token);
    return next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('El token de sesión ha expirado', 'TOKEN_EXPIRED'));
    }
    return next(AppError.unauthorized('Token de autenticación inválido', 'INVALID_TOKEN'));
  }
}

/**
 * Attaches req.user when a valid Bearer token is present; otherwise continues as guest (req.user = null).
 */
async function optionalAuthMiddleware(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    req.user = await resolveUserFromToken(token);
    return next();
  } catch (_err) {
    req.user = null;
    return next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  extractBearerToken
};
