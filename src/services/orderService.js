const crypto = require('crypto');
const { getConnection } = require('../config/database');
const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const addressModel = require('../models/addressModel');
const reservationModel = require('../models/reservationModel');
const cartService = require('./cartService');
const inventoryService = require('./inventoryService');
const paymentService = require('./paymentService');
const mailService = require('./mailService');
const { AppError } = require('../utils/appError');
const {
  ORDER_STATUS,
  ALLOWED_ORDER_TRANSITIONS,
  DELIVERY_METHODS,
  SHIPPING_CONFIG
} = require('../utils/constants');
const { cleanText, normalizeEmail } = require('../utils/sanitizer');

function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LE-${datePart}-${randomPart}`;
}

function calculateOrderTotals(items, deliveryMethod) {
  let subtotal = 0;

  const snapshotItems = items.map((item) => {
    const unitPrice = Number(item.price);
    const quantity = Number(item.quantity);
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;

    return {
      productId: item.product_id,
      skuSnapshot: item.sku,
      titleSnapshot: item.title,
      unitPriceSnapshot: unitPrice.toFixed(2),
      quantity,
      lineTotal: lineTotal.toFixed(2)
    };
  });

  const discountAmount = 0;
  const shippingCost =
    deliveryMethod === DELIVERY_METHODS.STORE_PICKUP ||
    subtotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_CONFIG.FLAT_RATE;
  const taxAmount = subtotal * SHIPPING_CONFIG.TAX_RATE;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost + taxAmount);

  return {
    snapshotItems,
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    shippingCost: shippingCost.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2)
  };
}

async function resolveShippingAddressSnapshot({ userId, deliveryMethod, addressId, shippingAddress, conn }) {
  if (deliveryMethod === DELIVERY_METHODS.STORE_PICKUP) {
    return {
      type: 'store_pickup',
      pickupLocation: 'Librería Estudio — Tienda Central'
    };
  }

  if (addressId) {
    if (!userId) {
      throw AppError.badRequest('Debes iniciar sesión para usar una dirección guardada', 'AUTH_REQUIRED_FOR_ADDRESS');
    }
    const savedAddress = await addressModel.findByIdAndUserId(addressId, userId, conn);
    if (!savedAddress) {
      throw AppError.notFound('Dirección de envío no encontrada', 'ADDRESS_NOT_FOUND');
    }
    return {
      addressId: savedAddress.id,
      label: savedAddress.label,
      recipientName: savedAddress.recipient_name,
      recipientPhone: savedAddress.recipient_phone,
      addressLine1: savedAddress.address_line_1,
      addressLine2: savedAddress.address_line_2,
      city: savedAddress.city,
      stateOrDepartment: savedAddress.state_or_department,
      postalCode: savedAddress.postal_code,
      referenceNotes: savedAddress.reference_notes
    };
  }

  if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city) {
    throw AppError.badRequest(
      'Debes proporcionar una dirección de envío válida',
      'SHIPPING_ADDRESS_REQUIRED'
    );
  }

  return {
    recipientName: cleanText(shippingAddress.recipientName || ''),
    recipientPhone: cleanText(shippingAddress.recipientPhone || ''),
    addressLine1: cleanText(shippingAddress.addressLine1),
    addressLine2: shippingAddress.addressLine2 ? cleanText(shippingAddress.addressLine2) : null,
    city: cleanText(shippingAddress.city),
    stateOrDepartment: cleanText(shippingAddress.stateOrDepartment || ''),
    postalCode: shippingAddress.postalCode ? cleanText(shippingAddress.postalCode) : null,
    referenceNotes: shippingAddress.referenceNotes ? cleanText(shippingAddress.referenceNotes) : null
  };
}

async function createOrder({ userId = null, cartToken = null, payload }) {
  if (payload.paymentReference) {
    const existing = await paymentService.findExistingByPaymentReference(payload.paymentReference);
    if (existing) {
      return {
        idempotentReplay: true,
        order: existing
      };
    }
  }

  const deliveryMethod = payload.deliveryMethod || DELIVERY_METHODS.HOME_DELIVERY;
  const conn = await getConnection();
  let createdOrderSummary = null;

  try {
    await conn.beginTransaction();

    const { cart } = await cartService.resolveOrCreateCart({
      userId,
      cartToken,
      createIfMissing: false,
      conn
    });

    if (!cart) {
      throw AppError.badRequest('Tu carrito está vacío', 'EMPTY_CART');
    }

    const cartItems = await cartModel.getCartItems(cart.id, conn);
    if (cartItems.length === 0) {
      throw AppError.badRequest('Tu carrito está vacío', 'EMPTY_CART');
    }

    for (const item of cartItems) {
      if (!item.is_active) {
        throw AppError.conflict(
          `El producto "${item.title}" ya no está disponible`,
          'PRODUCT_UNAVAILABLE',
          { productId: item.product_id }
        );
      }
    }

    // Reconcile active reservations vs cart item quantities atomically
    const activeReservations = await reservationModel.findActiveByCartId(cart.id, conn);
    const reservedByProduct = new Map();
    for (const resv of activeReservations) {
      const prev = reservedByProduct.get(resv.product_id) || 0;
      reservedByProduct.set(resv.product_id, prev + Number(resv.quantity));
    }

    // Complete existing active reservations first
    await inventoryService.completeCartReservations({ cartId: cart.id, conn });

    // For any item where reservation expired or was partial, reserve & consume remaining delta
    for (const item of cartItems) {
      const alreadyReserved = reservedByProduct.get(item.product_id) || 0;
      const needed = Number(item.quantity);
      if (needed > alreadyReserved) {
        const delta = needed - alreadyReserved;
        const ok = await reservationModel.reserveProductStock(item.product_id, delta, conn);
        if (!ok) {
          throw AppError.conflict(
            `Stock insuficiente para "${item.title}"`,
            'INSUFFICIENT_STOCK',
            { productId: item.product_id, requestedQuantity: needed }
          );
        }
        await reservationModel.consumeReservedStock(item.product_id, delta, conn);
      }
    }

    const totals = calculateOrderTotals(cartItems, deliveryMethod);
    const shippingSnapshot = await resolveShippingAddressSnapshot({
      userId,
      deliveryMethod,
      addressId: payload.addressId,
      shippingAddress: payload.shippingAddress,
      conn
    });

    const paymentResult = await paymentService.authorizePayment({
      paymentReference: payload.paymentReference,
      totalAmount: totals.totalAmount
    });

    const orderNumber = generateOrderNumber();
    const customerEmail = normalizeEmail(payload.customerEmail);
    const customerName = cleanText(payload.customerName);
    const customerPhone = payload.customerPhone ? cleanText(payload.customerPhone) : null;

    const orderId = await orderModel.createOrder(
      {
        orderNumber,
        userId,
        customerEmail,
        customerName,
        customerPhone,
        shippingAddressSnapshot: shippingSnapshot,
        deliveryMethod,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingCost: totals.shippingCost,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        status: paymentResult.status,
        paymentReference: paymentResult.paymentReference,
        termsAccepted: true,
        termsAcceptedAt: new Date()
      },
      conn
    );

    await orderModel.createOrderItems(orderId, totals.snapshotItems, conn);
    await cartModel.clearCart(cart.id, conn);

    await conn.commit();

    createdOrderSummary = {
      id: orderId,
      orderNumber,
      customerEmail,
      customerName,
      deliveryMethod,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      shippingCost: totals.shippingCost,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: paymentResult.status,
      paymentReference: paymentResult.paymentReference,
      items: totals.snapshotItems
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Send confirmation email outside transaction
  mailService.sendOrderConfirmation(createdOrderSummary);

  return {
    idempotentReplay: false,
    order: createdOrderSummary
  };
}

async function listUserOrders(userId, page = 1, limit = 10) {
  return orderModel.listByUserId(userId, page, limit);
}

async function getUserOrderDetail(orderNumber, userId) {
  const order = await orderModel.findByOrderNumberAndUserId(cleanText(orderNumber), userId);
  if (!order) {
    throw AppError.notFound('Orden no encontrada', 'ORDER_NOT_FOUND');
  }
  return order;
}

async function trackPublicOrder(orderNumber, customerEmail) {
  const order = await orderModel.findForTracking(cleanText(orderNumber), normalizeEmail(customerEmail));
  if (!order) {
    throw AppError.notFound(
      'No encontramos una orden que coincida con el número y correo proporcionados',
      'ORDER_NOT_FOUND'
    );
  }
  return order;
}

async function transitionOrderStatus(orderId, currentStatus, nextStatus) {
  const allowedNext = ALLOWED_ORDER_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.has(nextStatus)) {
    throw AppError.badRequest(
      `Transición de estado inválida: "${currentStatus}" -> "${nextStatus}"`,
      'INVALID_ORDER_TRANSITION'
    );
  }

  const updated = await orderModel.updateStatus(orderId, nextStatus);
  if (!updated) {
    throw AppError.notFound('Orden no encontrada', 'ORDER_NOT_FOUND');
  }

  return {
    orderId,
    previousStatus: currentStatus,
    status: nextStatus
  };
}

module.exports = {
  createOrder,
  listUserOrders,
  getUserOrderDetail,
  trackPublicOrder,
  transitionOrderStatus,
  ORDER_STATUS
};
