const orderService = require('../services/orderService');
const { extractCartToken } = require('./cartController');
const { sendSuccess } = require('../utils/responseHelper');

async function createOrder(req, res, next) {
  try {
    const result = await orderService.createOrder({
      userId: req.user ? req.user.id : null,
      cartToken: extractCartToken(req),
      payload: req.body
    });

    return sendSuccess(res, {
      statusCode: result.idempotentReplay ? 200 : 201,
      message: result.idempotentReplay
        ? 'Orden recuperada mediante referencia idempotente'
        : 'Orden creada exitosamente',
      data: result.order
    });
  } catch (err) {
    return next(err);
  }
}

async function listMyOrders(req, res, next) {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const orders = await orderService.listUserOrders(req.user.id, page, limit);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Historial de órdenes obtenido',
      data: orders,
      meta: { page, limit }
    });
  } catch (err) {
    return next(err);
  }
}

async function getMyOrderDetail(req, res, next) {
  try {
    const order = await orderService.getUserOrderDetail(req.params.orderNumber, req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Detalle de orden',
      data: order
    });
  } catch (err) {
    return next(err);
  }
}

async function trackOrder(req, res, next) {
  try {
    const order = await orderService.trackPublicOrder(req.query.orderNumber, req.query.email);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Estado de orden consultado',
      data: order
    });
  } catch (err) {
    return next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const result = await orderService.transitionOrderStatus(
      req.params.orderId,
      req.body.currentStatus,
      req.body.nextStatus
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Estado de la orden actualizado',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrderDetail,
  trackOrder,
  updateOrderStatus
};
