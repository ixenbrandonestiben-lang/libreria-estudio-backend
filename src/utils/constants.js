const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer'
});

const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
});

/**
 * Valid order state machine transitions.
 */
const ALLOWED_ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING_PAYMENT]: new Set([ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED]),
  [ORDER_STATUS.PAID]: new Set([ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED]),
  [ORDER_STATUS.PROCESSING]: new Set([ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED]),
  [ORDER_STATUS.SHIPPED]: new Set([ORDER_STATUS.DELIVERED, ORDER_STATUS.REFUNDED]),
  [ORDER_STATUS.DELIVERED]: new Set([ORDER_STATUS.REFUNDED]),
  [ORDER_STATUS.CANCELLED]: new Set([]),
  [ORDER_STATUS.REFUNDED]: new Set([])
});

const RESERVATION_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  RELEASED: 'released'
});

const DELIVERY_METHODS = Object.freeze({
  HOME_DELIVERY: 'home_delivery',
  STORE_PICKUP: 'store_pickup'
});

const FAQ_TOPICS = Object.freeze(['orders', 'shipping', 'returns', 'school_lists', 'account']);

const TICKET_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 48,
  ORDER_DEFAULT_LIMIT: 10,
  ORDER_MAX_LIMIT: 50
});

const COOKIE_NAMES = Object.freeze({
  CART_TOKEN: 'le_cart_token',
  CONSENT_TOKEN: 'le_consent_token'
});

const SHIPPING_CONFIG = Object.freeze({
  FLAT_RATE: 35.0,
  FREE_SHIPPING_THRESHOLD: 300.0,
  TAX_RATE: 0.0
});

const LEGAL_VERSIONS = Object.freeze({
  TERMS_VERSION: '1.0',
  PRIVACY_VERSION: '1.0',
  COOKIE_POLICY_VERSION: '1.0'
});

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  ALLOWED_ORDER_TRANSITIONS,
  RESERVATION_STATUS,
  DELIVERY_METHODS,
  FAQ_TOPICS,
  TICKET_STATUS,
  PAGINATION,
  COOKIE_NAMES,
  SHIPPING_CONFIG,
  LEGAL_VERSIONS
};
