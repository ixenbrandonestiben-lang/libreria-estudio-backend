const crypto = require('crypto');
const orderModel = require('../models/orderModel');
const { ORDER_STATUS } = require('../utils/constants');
const { AppError } = require('../utils/appError');

function generatePaymentReference() {
  return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Checks idempotency by paymentReference before creating/charging an order.
 */
async function findExistingByPaymentReference(paymentReference, conn = null) {
  if (!paymentReference) {
    return null;
  }
  return orderModel.findByPaymentReference(paymentReference, conn);
}

/**
 * Simulated idempotent payment authorization for checkout.
 * Never trusts client-supplied amounts; expects server-computed totalAmount.
 */
async function authorizePayment({ paymentReference, totalAmount }) {
  const ref = paymentReference || generatePaymentReference();
  const existing = await findExistingByPaymentReference(ref);

  if (existing) {
    if (Number(existing.total_amount).toFixed(2) !== Number(totalAmount).toFixed(2)) {
      throw AppError.conflict(
        'La referencia de pago ya fue utilizada con un monto diferente',
        'PAYMENT_REFERENCE_MISMATCH'
      );
    }
    return {
      idempotentReplay: true,
      paymentReference: existing.payment_reference,
      status: existing.status,
      existingOrder: existing
    };
  }

  return {
    idempotentReplay: false,
    paymentReference: ref,
    status: ORDER_STATUS.PAID
  };
}

module.exports = {
  generatePaymentReference,
  findExistingByPaymentReference,
  authorizePayment
};
