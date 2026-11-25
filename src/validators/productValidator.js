const { query, param } = require('express-validator');

const ALLOWED_SORTS = ['newest', 'price_asc', 'price_desc', 'title_asc'];

const listProductsValidator = [
  query('page').optional().isInt({ min: 1, max: 10000 }).withMessage('Página inválida').toInt(),
  query('limit').optional().isInt({ min: 1, max: 48 }).withMessage('Límite inválido (1-48)').toInt(),
  query('category').optional().trim().isLength({ min: 1, max: 100 }),
  query('brand').optional().trim().isLength({ min: 1, max: 100 }),
  query('q').optional().trim().isLength({ max: 120 }).withMessage('Búsqueda demasiado larga'),
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Búsqueda demasiado larga'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice debe ser >= 0').toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice debe ser >= 0').toFloat(),
  query('inStockOnly').optional().isBoolean().withMessage('inStockOnly debe ser booleano').toBoolean(),
  query('sort')
    .optional()
    .isIn(ALLOWED_SORTS)
    .withMessage(`sort debe ser uno de: ${ALLOWED_SORTS.join(', ')}`)
];

const productIdentifierValidator = [
  param('identifier')
    .trim()
    .notEmpty()
    .withMessage('El identificador del producto es obligatorio')
    .isLength({ max: 180 })
    .withMessage('Identificador inválido')
];

module.exports = {
  listProductsValidator,
  productIdentifierValidator
};
