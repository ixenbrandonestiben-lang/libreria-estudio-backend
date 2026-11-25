const { body, param } = require('express-validator');

const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('El nombre debe tener entre 2 y 120 caracteres'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono debe tener entre 7 y 30 caracteres')
];

const addressValidator = [
  body('label').optional().trim().isLength({ min: 1, max: 50 }),
  body('recipientName')
    .trim()
    .notEmpty()
    .withMessage('recipientName es obligatorio')
    .isLength({ min: 2, max: 150 }),
  body('recipientPhone')
    .trim()
    .notEmpty()
    .withMessage('recipientPhone es obligatorio')
    .isLength({ min: 7, max: 30 }),
  body('addressLine1')
    .trim()
    .notEmpty()
    .withMessage('addressLine1 es obligatorio')
    .isLength({ min: 3, max: 200 }),
  body('addressLine2').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('city').trim().notEmpty().withMessage('city es obligatorio').isLength({ max: 100 }),
  body('stateOrDepartment')
    .trim()
    .notEmpty()
    .withMessage('stateOrDepartment es obligatorio')
    .isLength({ max: 100 }),
  body('postalCode').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('referenceNotes').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('isDefault').optional().isBoolean().toBoolean()
];

const addressIdParamValidator = [
  param('addressId').isInt({ min: 1 }).withMessage('addressId inválido').toInt()
];

module.exports = {
  updateProfileValidator,
  addressValidator,
  addressIdParamValidator
};
