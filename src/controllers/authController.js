const authService = require('../services/authService');
const { sendSuccess } = require('../utils/responseHelper');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Cuenta creada correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Inicio de sesión exitoso',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Contraseña actualizada correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Perfil autenticado',
      data: { user }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
