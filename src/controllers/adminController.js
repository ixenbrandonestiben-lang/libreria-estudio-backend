const adminService = require('../services/adminService');
const { sendSuccess } = require('../utils/responseHelper');

async function listUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Usuarios obtenidos correctamente',
      data: result.items,
      meta: result.pagination
    });
  } catch (err) {
    return next(err);
  }
}

async function updateUserRoleAndStatus(req, res, next) {
  try {
    const user = await adminService.updateUserRoleAndStatus(
      req.user.id,
      req.params.userId,
      {
        role: req.body.role,
        isActive: req.body.isActive
      }
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Usuario actualizado correctamente',
      data: user
    });
  } catch (err) {
    return next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const result = await adminService.listProducts(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Productos obtenidos correctamente',
      data: result.items,
      meta: result.pagination
    });
  } catch (err) {
    return next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await adminService.createProduct(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Producto creado correctamente',
      data: product
    });
  } catch (err) {
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await adminService.updateProduct(req.params.productId, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Producto actualizado correctamente',
      data: product
    });
  } catch (err) {
    return next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const result = await adminService.listOrders(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Órdenes obtenidas correctamente',
      data: result.items,
      meta: result.pagination
    });
  } catch (err) {
    return next(err);
  }
}

async function listTickets(req, res, next) {
  try {
    const result = await adminService.listTickets(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tickets de soporte obtenidos correctamente',
      data: result.items,
      meta: result.pagination
    });
  } catch (err) {
    return next(err);
  }
}

async function updateTicketStatus(req, res, next) {
  try {
    const result = await adminService.updateTicketStatus(
      req.params.ticketCode,
      req.body.status
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Estado del ticket actualizado correctamente',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

async function getDashboardAnalytics(req, res, next) {
  try {
    const analytics = await adminService.getDashboardAnalytics();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Analítica ejecutiva obtenida correctamente',
      data: analytics
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  updateUserRoleAndStatus,
  listProducts,
  createProduct,
  updateProduct,
  listOrders,
  listTickets,
  updateTicketStatus,
  getDashboardAnalytics
};
