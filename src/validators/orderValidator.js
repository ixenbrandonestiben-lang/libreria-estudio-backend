const { body, param, query } = require('express-validator');
const { DELIVERY_METHODS, ORDER_STATUS } = require('../utils/constants');

const createOrderValidator = [
  body('customerEmail')
    .trim()
    .notEmpty()
    .withMessage('customerEmail es obligatorio')
    .isEmail()
    .withMessage('customerEmail inválido')
    .normalizeEmail(),
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('customerName es obligatorio')
    .isLength({ min: 2, max: 150 })
    .withMessage('customerName debe tener entre 2 y 150 caracteres'),
  body('customerPhone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('customerPhone inválido'),
  body('deliveryMethod')
    .optional()
    .isIn(Object.values(DELIVERY_METHODS))
    .withMessage('deliveryMethod inválido'),
  body('addressId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('addressId inválido')
    .toInt(),
  body('shippingAddress')
    .optional({ nullable: true })
    .isObject()
    .withMessage('shippingAddress debe ser un objeto'),
  body('shippingAddress.addressLine1')
    .if((_value, { req }) => req.body.deliveryMethod !== DELIVERY_METHODS.STORE_PICKUP && !req.body.addressId)
    .trim()
    .notEmpty()
    .withMessage('La dirección de entrega es obligatoria para envío a domicilio')
    .isLength({ max: 200 }),
  body('shippingAddress.city')
    .if((_value, { req }) => req.body.deliveryMethod !== DELIVERY_METHODS.STORE_PICKUP && !req.body.addressId)
    .trim()
    .notEmpty()
    .withMessage('La ciudad es obligatoria para envío a domicilio')
    .isLength({ max: 100 }),
  body('shippingAddress.stateOrDepartment')
    .if((_value, { req }) => req.body.deliveryMethod !== DELIVERY_METHODS.STORE_PICKUP && !req.body.addressId)
    .trim()
    .notEmpty()
    .withMessage('El departamento/estado es obligatorio para envío a domicilio')
    .isLength({ max: 100 }),
  body('paymentReference')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 6, max: 120 })
    .withMessage('paymentReference debe tener entre 6 y 120 caracteres')
];

const listOrdersValidator = [
  query('page').optional().isInt({ min: 1, max: 10000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
];

const orderNumberParamValidator = [
  param('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('orderNumber es obligatorio')
    .isLength({ max: 40 })
];

const trackOrderValidator = [
  query('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('orderNumber es obligatorio')
    .isLength({ max: 40 }),
  query('email')
    .trim()
    .notEmpty()
    .withMessage('email es obligatorio')
    .isEmail()
    .withMessage('email inválido')
    .normalizeEmail()
];

const updateOrderStatusValidator = [
  param('orderId').isInt({ min: 1 }).withMessage('orderId inválido').toInt(),
  body('currentStatus')
    .notEmpty()
    .isIn(Object.values(ORDER_STATUS))
    .withMessage('currentStatus inválido'),
  body('nextStatus')
    .notEmpty()
    .isIn(Object.values(ORDER_STATUS))
    .withMessage('nextStatus inválido')
];

module.exports = {
  createOrderValidator,
  listOrdersValidator,
  orderNumberParamValidator,
  trackOrderValidator,
  updateOrderStatusValidator
};
