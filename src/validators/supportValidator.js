const { body, query } = require('express-validator');
const { FAQ_TOPICS } = require('../utils/constants');

const listFaqValidator = [
  query('topic')
    .optional()
    .trim()
    .isIn(FAQ_TOPICS)
    .withMessage(`topic debe ser uno de: ${FAQ_TOPICS.join(', ')}`),
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Búsqueda demasiado larga')
];

const createTicketValidator = [
  body('contactEmail')
    .trim()
    .notEmpty()
    .withMessage('contactEmail es obligatorio')
    .isEmail()
    .withMessage('contactEmail inválido')
    .normalizeEmail(),
  body('orderNumber').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 40 }),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('subject es obligatorio')
    .isLength({ min: 4, max: 200 })
    .withMessage('subject debe tener entre 4 y 200 caracteres'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('message es obligatorio')
    .isLength({ min: 10, max: 3000 })
    .withMessage('message debe tener entre 10 y 3000 caracteres')
];

const trackTicketValidator = [
  query('ticketCode').trim().notEmpty().withMessage('ticketCode es obligatorio').isLength({ max: 40 }),
  query('email')
    .trim()
    .notEmpty()
    .withMessage('email es obligatorio')
    .isEmail()
    .withMessage('email inválido')
    .normalizeEmail()
];

const cookieConsentValidator = [
  body('analyticsEnabled').isBoolean().withMessage('analyticsEnabled debe ser booleano').toBoolean(),
  body('preferencesEnabled')
    .isBoolean()
    .withMessage('preferencesEnabled debe ser booleano')
    .toBoolean(),
  body('policyVersion').optional().trim().isLength({ min: 1, max: 32 })
];

module.exports = {
  listFaqValidator,
  createTicketValidator,
  trackTicketValidator,
  cookieConsentValidator
};
