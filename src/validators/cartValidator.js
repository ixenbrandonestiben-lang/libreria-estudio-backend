const { body, param } = require('express-validator');

const addCartItemValidator = [
  body('productId')
    .notEmpty()
    .withMessage('productId es obligatorio')
    .isInt({ min: 1 })
    .withMessage('productId debe ser un entero positivo')
    .toInt(),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('quantity debe ser un entero entre 1 y 100')
    .toInt()
];

const updateCartItemValidator = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('productId inválido')
    .toInt(),
  body('quantity')
    .notEmpty()
    .withMessage('quantity es obligatorio')
    .isInt({ min: 0, max: 100 })
    .withMessage('quantity debe ser un entero entre 0 y 100')
    .toInt()
];

const removeCartItemValidator = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('productId inválido')
    .toInt()
];

module.exports = {
  addCartItemValidator,
  updateCartItemValidator,
  removeCartItemValidator
};
