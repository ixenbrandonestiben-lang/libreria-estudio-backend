const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const orderModel = require('../models/orderModel');
const supportModel = require('../models/supportModel');
const { AppError } = require('../utils/appError');
const { USER_ROLES } = require('../utils/constants');
const { cleanText, escapeLike } = require('../utils/sanitizer');

async function listUsers({ page, limit, q } = {}) {
  const sanitizedQ = q ? escapeLike(cleanText(q)) : undefined;
  return userModel.findAllForAdmin({ page, limit, q: sanitizedQ });
}

async function updateUserRoleAndStatus(actingAdminId, targetUserId, { role, isActive } = {}) {
  if (Number(actingAdminId) === Number(targetUserId)) {
    const removesAdminRole = role !== undefined && role !== USER_ROLES.ADMIN;
    const deactivatesSelf = isActive === false;
    if (removesAdminRole || deactivatesSelf) {
      throw AppError.badRequest(
        'No puedes quitarte tu propio rol de administrador ni desactivar tu cuenta',
        'SELF_ROLE_CHANGE_FORBIDDEN'
      );
    }
  }

  const updated = await userModel.updateRoleAndStatus(targetUserId, { role, isActive });
  if (!updated) {
    throw AppError.notFound('Usuario no encontrado', 'USER_NOT_FOUND');
  }

  return updated;
}

async function listProducts({ page, limit, q } = {}) {
  const sanitizedQ = q ? escapeLike(cleanText(q)) : undefined;
  return productModel.findAllForAdmin({ page, limit, q: sanitizedQ });
}

async function createProduct(data) {
  const payload = {
    categoryId: data.categoryId,
    brandId: data.brandId,
    sku: cleanText(data.sku),
    isbn: data.isbn ? cleanText(data.isbn) : null,
    title: cleanText(data.title),
    slug: cleanText(data.slug).toLowerCase(),
    shortDescription: cleanText(data.shortDescription),
    unitLabel: data.unitLabel ? cleanText(data.unitLabel) : 'unidad',
    unitsPerPack: data.unitsPerPack !== undefined ? data.unitsPerPack : 1,
    price: Number(data.price).toFixed(2),
    stockAvailable: data.stockAvailable !== undefined ? data.stockAvailable : 0,
    imageUrl: data.imageUrl ? cleanText(data.imageUrl) : null,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
  };

  return productModel.createProduct(payload);
}

async function updateProduct(productId, data = {}) {
  const payload = {};

  if (data.categoryId !== undefined) payload.categoryId = data.categoryId;
  if (data.brandId !== undefined) payload.brandId = data.brandId;
  if (data.sku !== undefined) payload.sku = cleanText(data.sku);
  if (data.isbn !== undefined) payload.isbn = data.isbn ? cleanText(data.isbn) : null;
  if (data.title !== undefined) payload.title = cleanText(data.title);
  if (data.slug !== undefined) payload.slug = cleanText(data.slug).toLowerCase();
  if (data.shortDescription !== undefined) {
    payload.shortDescription = cleanText(data.shortDescription);
  }
  if (data.unitLabel !== undefined) payload.unitLabel = cleanText(data.unitLabel);
  if (data.unitsPerPack !== undefined) payload.unitsPerPack = data.unitsPerPack;
  if (data.price !== undefined) payload.price = Number(data.price).toFixed(2);
  if (data.stockAvailable !== undefined) payload.stockAvailable = data.stockAvailable;
  if (data.imageUrl !== undefined) {
    payload.imageUrl = data.imageUrl ? cleanText(data.imageUrl) : null;
  }
  if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

  const updated = await productModel.updateProduct(productId, payload);
  if (!updated) {
    throw AppError.notFound('Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }

  return updated;
}

async function listOrders({ page, limit, status } = {}) {
  return orderModel.findAllForAdmin({ page, limit, status });
}

async function listTickets({ page, limit, status } = {}) {
  return supportModel.findAllTicketsForAdmin({ page, limit, status });
}

async function updateTicketStatus(ticketCode, status) {
  const cleanCode = cleanText(ticketCode);
  const updated = await supportModel.updateTicketStatus(cleanCode, status);
  if (!updated) {
    throw AppError.notFound('Ticket de soporte no encontrado', 'TICKET_NOT_FOUND');
  }

  return { ticketCode: cleanCode, status };
}

module.exports = {
  listUsers,
  updateUserRoleAndStatus,
  listProducts,
  createProduct,
  updateProduct,
  listOrders,
  listTickets,
  updateTicketStatus
};
