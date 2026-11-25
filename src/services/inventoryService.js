const { getConnection } = require('../config/database');
const { env } = require('../config/env');
const reservationModel = require('../models/reservationModel');
const { AppError } = require('../utils/appError');
const { RESERVATION_STATUS } = require('../utils/constants');
const { logger } = require('../utils/logger');

function computeReservationExpiry() {
  return new Date(Date.now() + env.reservations.ttlMinutes * 60 * 1000);
}

/**
 * Atomically reserves stock and records a reservation row inside an existing transaction.
 */
async function reserveStock({ cartId = null, userId = null, productId, quantity, conn }) {
  const reserved = await reservationModel.reserveProductStock(productId, quantity, conn);
  if (!reserved) {
    throw AppError.conflict(
      'Stock insuficiente para completar la reserva del producto',
      'INSUFFICIENT_STOCK',
      { productId, requestedQuantity: quantity }
    );
  }

  const expiresAt = computeReservationExpiry();
  const reservationId = await reservationModel.createReservation(
    {
      cartId,
      userId,
      productId,
      quantity,
      expiresAt
    },
    conn
  );

  return {
    reservationId,
    expiresAt
  };
}

/**
 * Releases all active reservations for a cart and returns stock to available.
 */
async function releaseCartReservations({
  cartId,
  nextStatus = RESERVATION_STATUS.RELEASED,
  conn
}) {
  const activeReservations = await reservationModel.findActiveByCartId(cartId, conn);

  for (const resv of activeReservations) {
    const transitioned = await reservationModel.transitionActiveStatus(resv.id, nextStatus, conn);
    if (transitioned) {
      await reservationModel.restoreProductStock(resv.product_id, resv.quantity, conn);
    }
  }

  return activeReservations.length;
}

/**
 * Releases active reservations for a single product in a cart.
 */
async function releaseCartProductReservations({
  cartId,
  productId,
  nextStatus = RESERVATION_STATUS.RELEASED,
  conn
}) {
  const activeReservations = await reservationModel.findActiveByCartId(cartId, conn);
  const matching = activeReservations.filter((r) => Number(r.product_id) === Number(productId));

  for (const resv of matching) {
    const transitioned = await reservationModel.transitionActiveStatus(resv.id, nextStatus, conn);
    if (transitioned) {
      await reservationModel.restoreProductStock(resv.product_id, resv.quantity, conn);
    }
  }
}

/**
 * Completes all active reservations for a cart when an order is created/confirmed.
 */
async function completeCartReservations({ cartId, conn }) {
  const activeReservations = await reservationModel.findActiveByCartId(cartId, conn);

  for (const resv of activeReservations) {
    const transitioned = await reservationModel.transitionActiveStatus(
      resv.id,
      RESERVATION_STATUS.COMPLETED,
      conn
    );
    if (transitioned) {
      await reservationModel.consumeReservedStock(resv.product_id, resv.quantity, conn);
    }
  }

  return activeReservations.length;
}

/**
 * Background batch job: releases expired active reservations inside an ACID transaction.
 */
async function releaseExpiredReservationsBatch(limit = 100) {
  const conn = await getConnection();
  let releasedCount = 0;

  try {
    await conn.beginTransaction();

    const expired = await reservationModel.findExpiredActiveForUpdate(limit, conn);
    for (const resv of expired) {
      const transitioned = await reservationModel.transitionActiveStatus(
        resv.id,
        RESERVATION_STATUS.EXPIRED,
        conn
      );
      if (transitioned) {
        await reservationModel.restoreProductStock(resv.product_id, resv.quantity, conn);
        releasedCount += 1;
      }
    }

    await conn.commit();

    if (releasedCount > 0) {
      logger.info('Reservas expiradas liberadas', { releasedCount });
    }
    return releasedCount;
  } catch (err) {
    await conn.rollback();
    logger.error('Error al liberar reservas expiradas', { error: err.message });
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  reserveStock,
  releaseCartReservations,
  releaseCartProductReservations,
  completeCartReservations,
  releaseExpiredReservationsBatch
};
