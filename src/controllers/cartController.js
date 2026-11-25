const cartService = require('../services/cartService');
const { getCookieOptions } = require('../config/security');
const { COOKIE_NAMES } = require('../utils/constants');
const { sendSuccess } = require('../utils/responseHelper');

function extractCartToken(req) {
  const headerToken = req.headers['x-cart-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader === 'string') {
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAMES.CART_TOKEN}=`));
    if (match) {
      return decodeURIComponent(match.split('=')[1] || '');
    }
  }
  return null;
}

function attachCartTokenIfGuest(res, req, result) {
  if (!req.user && result.cartToken) {
    res.setHeader('X-Cart-Token', result.cartToken);
    res.cookie(COOKIE_NAMES.CART_TOKEN, result.cartToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
  }
}

async function getCart(req, res, next) {
  try {
    const result = await cartService.getCart({
      userId: req.user ? req.user.id : null,
      cartToken: extractCartToken(req)
    });
    attachCartTokenIfGuest(res, req, result);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Carrito obtenido correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const result = await cartService.addItem({
      userId: req.user ? req.user.id : null,
      cartToken: extractCartToken(req),
      productId: req.body.productId,
      quantity: req.body.quantity || 1
    });
    attachCartTokenIfGuest(res, req, result);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Producto agregado al carrito con reserva de stock',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const result = await cartService.updateItemQuantity({
      userId: req.user ? req.user.id : null,
      cartToken: extractCartToken(req),
      productId: req.params.productId,
      quantity: req.body.quantity
    });
    attachCartTokenIfGuest(res, req, result);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cantidad actualizada en el carrito',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const result = await cartService.removeItem({
      userId: req.user ? req.user.id : null,
      cartToken: extractCartToken(req),
      productId: req.params.productId
    });
    attachCartTokenIfGuest(res, req, result);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Producto eliminado del carrito',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    const result = await cartService.clearCart({
      userId: req.user ? req.user.id : null,
      cartToken: extractCartToken(req)
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Carrito vaciado correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  extractCartToken
};
