const { body, param, query } = require('express-validator');
const { USER_ROLES, ORDER_STATUS, TICKET_STATUS } = require('../utils/constants');

const listUsersValidator = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Página inválida').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido (1-100)').toInt(),
  query('q').optional().trim().isLength({ max: 120 }).withMessage('Búsqueda demasiado larga')
];

const updateUserRoleAndStatusValidator = [
  param('userId').isInt({ min: 1 }).withMessage('userId inválido').toInt(),
  body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage(`role debe ser uno de: ${Object.values(USER_ROLES).join(', ')}`),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano')
    .toBoolean(),
  body().custom((value) => {
    if (!value || (value.role === undefined && value.isActive === undefined)) {
      throw new Error('Debes enviar al menos role o isActive');
    }
    return true;
  })
];

const listAdminProductsValidator = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Página inválida').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido (1-100)').toInt(),
  query('q').optional().trim().isLength({ max: 120 }).withMessage('Búsqueda demasiado larga')
];

const createProductValidator = [
  body('categoryId').isInt({ min: 1 }).withMessage('categoryId inválido').toInt(),
  body('brandId').isInt({ min: 1 }).withMessage('brandId inválido').toInt(),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('sku es obligatorio')
    .isLength({ min: 2, max: 64 })
    .withMessage('sku debe tener entre 2 y 64 caracteres'),
  body('isbn')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('isbn máximo 20 caracteres'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('title es obligatorio')
    .isLength({ min: 2, max: 220 })
    .withMessage('title debe tener entre 2 y 220 caracteres'),
  body('slug')
    .trim()
    .notEmpty()
    .withMessage('slug es obligatorio')
    .isLength({ min: 2, max: 240 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('slug debe usar formato kebab-case'),
  body('shortDescription')
    .trim()
    .notEmpty()
    .withMessage('shortDescription es obligatorio')
    .isLength({ min: 2, max: 500 })
    .withMessage('shortDescription máximo 500 caracteres'),
  body('unitLabel')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage('unitLabel máximo 60 caracteres'),
  body('unitsPerPack')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('unitsPerPack debe ser >= 1')
    .toInt(),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('price debe ser mayor a 0')
    .toFloat(),
  body('stockAvailable')
    .optional()
    .isInt({ min: 0, max: 1000000 })
    .withMessage('stockAvailable debe ser >= 0')
    .toInt(),
  body('imageUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('imageUrl máximo 500 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano')
    .toBoolean()
];

const updateProductValidator = [
  param('productId').isInt({ min: 1 }).withMessage('productId inválido').toInt(),
  body('categoryId').optional().isInt({ min: 1 }).withMessage('categoryId inválido').toInt(),
  body('brandId').optional().isInt({ min: 1 }).withMessage('brandId inválido').toInt(),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('sku debe tener entre 2 y 64 caracteres'),
  body('isbn')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('isbn máximo 20 caracteres'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 220 })
    .withMessage('title debe tener entre 2 y 220 caracteres'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 240 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('slug debe usar formato kebab-case'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage('shortDescription máximo 500 caracteres'),
  body('unitLabel')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage('unitLabel máximo 60 caracteres'),
  body('unitsPerPack')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('unitsPerPack debe ser >= 1')
    .toInt(),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('price debe ser mayor a 0')
    .toFloat(),
  body('stockAvailable')
    .optional()
    .isInt({ min: 0, max: 1000000 })
    .withMessage('stockAvailable debe ser >= 0')
    .toInt(),
  body('imageUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('imageUrl máximo 500 caracteres'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano')
    .toBoolean(),
  body().custom((value) => {
    const updatableKeys = [
      'categoryId',
      'brandId',
      'sku',
      'isbn',
      'title',
      'slug',
      'shortDescription',
      'unitLabel',
      'unitsPerPack',
      'price',
      'stockAvailable',
      'imageUrl',
      'isActive'
    ];
    const hasUpdate = value && updatableKeys.some((k) => value[k] !== undefined);
    if (!hasUpdate) {
      throw new Error('Debes enviar al menos un campo para actualizar');
    }
    return true;
  })
];

const listAdminOrdersValidator = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Página inválida').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido (1-100)').toInt(),
  query('status')
    .optional()
    .isIn(Object.values(ORDER_STATUS))
    .withMessage('status de orden inválido')
];

const listAdminTicketsValidator = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Página inválida').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido (1-100)').toInt(),
  query('status')
    .optional()
    .isIn(Object.values(TICKET_STATUS))
    .withMessage('status de ticket inválido')
];

const updateTicketStatusValidator = [
  param('ticketCode')
    .trim()
    .notEmpty()
    .withMessage('ticketCode es obligatorio')
    .isLength({ max: 40 })
    .withMessage('ticketCode inválido'),
  body('status')
    .notEmpty()
    .withMessage('status es obligatorio')
    .isIn(Object.values(TICKET_STATUS))
    .withMessage(`status debe ser uno de: ${Object.values(TICKET_STATUS).join(', ')}`)
];

module.exports = {
  listUsersValidator,
  updateUserRoleAndStatusValidator,
  listAdminProductsValidator,
  createProductValidator,
  updateProductValidator,
  listAdminOrdersValidator,
  listAdminTicketsValidator,
  updateTicketStatusValidator
};
