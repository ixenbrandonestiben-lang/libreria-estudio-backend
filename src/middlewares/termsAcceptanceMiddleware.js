const { sendError } = require('../utils/responseHelper');

/**
 * Ensures explicit acceptance of Terms & Conditions before processing checkout/orders.
 */
function termsAcceptanceMiddleware(req, res, next) {
  const accepted =
    req.body && (req.body.termsAccepted === true || req.body.terms_accepted === true);

  if (!accepted) {
    return sendError(res, {
      statusCode: 400,
      code: 'TERMS_NOT_ACCEPTED',
      message: 'Debes aceptar los Términos y Condiciones para continuar.'
    });
  }

  return next();
}

module.exports = {
  termsAcceptanceMiddleware
};
