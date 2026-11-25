const { AppError } = require('../utils/appError');

/**
 * Restricts route access to users whose role is in allowedRoles.
 * @param {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  const allowedSet = new Set(allowedRoles);

  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Autenticación requerida', 'UNAUTHORIZED'));
    }

    if (!allowedSet.has(req.user.role)) {
      return next(
        AppError.forbidden('No tienes permisos suficientes para realizar esta acción', 'FORBIDDEN')
      );
    }

    return next();
  };
}

module.exports = {
  requireRole
};
