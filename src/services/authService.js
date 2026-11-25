const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { getConnection } = require('../config/database');
const userModel = require('../models/userModel');
const mailService = require('./mailService');
const { AppError } = require('../utils/appError');
const { USER_ROLES } = require('../utils/constants');
const { cleanText, normalizeEmail } = require('../utils/sanitizer');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn
    }
  );
}

function formatSafeUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: Boolean(user.is_active),
    createdAt: user.created_at
  };
}

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

async function register({ fullName, email, password, phone }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    throw AppError.conflict('Ya existe una cuenta registrada con ese correo electrónico', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(String(password), env.bcryptRounds);
  const createdUser = await userModel.createUser({
    fullName: cleanText(fullName),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? cleanText(phone) : null,
    role: USER_ROLES.CUSTOMER
  });

  const token = signAccessToken(createdUser);
  return {
    user: formatSafeUser(createdUser),
    token
  };
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const authUser = await userModel.findAuthByEmail(normalizedEmail);

  if (!authUser || !authUser.is_active) {
    throw AppError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(String(password), authUser.password_hash);
  if (!isMatch) {
    throw AppError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');
  }

  const token = signAccessToken(authUser);
  return {
    user: formatSafeUser(authUser),
    token
  };
}

async function forgotPassword({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await userModel.findByEmail(normalizedEmail);

  // Always return generic success to prevent user enumeration
  if (!user || !user.is_active) {
    return {
      accepted: true
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await userModel.createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;
  await mailService.sendPasswordReset({
    email: user.email,
    fullName: user.full_name,
    resetUrl
  });

  return {
    accepted: true
  };
}

async function resetPassword({ token, newPassword }) {
  const tokenHash = hashResetToken(token);
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    const resetRecord = await userModel.findValidResetToken(tokenHash, conn);
    if (!resetRecord) {
      throw AppError.badRequest('El enlace de recuperación es inválido o ha expirado', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(String(newPassword), env.bcryptRounds);
    await userModel.updatePasswordHash(resetRecord.user_id, passwordHash, conn);
    await userModel.markResetTokenUsed(resetRecord.id, conn);

    await conn.commit();
    return { reset: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user || !user.is_active) {
    throw AppError.notFound('Usuario no encontrado', 'USER_NOT_FOUND');
  }
  return formatSafeUser(user);
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
