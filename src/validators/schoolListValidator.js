const { body } = require('express-validator');

const quoteSchoolListValidator = [
  body().custom((value) => {
    const hasRawText = typeof value?.rawText === 'string' && value.rawText.trim().length > 0;
    const hasItems = Array.isArray(value?.items) && value.items.length > 0;
    if (!hasRawText && !hasItems) {
      throw new Error('Debes enviar rawText o un arreglo de items para cotizar la lista escolar');
    }
    return true;
  }),
  body('rawText')
    .optional()
    .isString()
    .withMessage('rawText debe ser una cadena de texto')
    .isLength({ max: 5000 })
    .withMessage('rawText no puede superar 5000 caracteres'),
  body('items')
    .optional()
    .isArray({ min: 1, max: 60 })
    .withMessage('items debe contener entre 1 y 60 renglones'),
  body('items.*.description')
    .if(body('items').exists())
    .trim()
    .notEmpty()
    .withMessage('Cada item debe incluir description')
    .isLength({ max: 250 })
    .withMessage('La descripción del item es demasiado larga'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La cantidad por item debe estar entre 1 y 100')
    .toInt(),
  body('educationLevel')
    .optional()
    .trim()
    .isIn(['preescolar', 'primaria', 'secundaria', 'universitario'])
    .withMessage('Nivel educativo inválido')
];

module.exports = {
  quoteSchoolListValidator
};
